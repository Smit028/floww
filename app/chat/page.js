"use client";
import { useEffect, useState, useRef } from "react";
import { firestore, auth } from "../firebase/firebase";
import {
  collection,
  onSnapshot,
  addDoc,
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
  query,
  where,
  deleteDoc,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Img1 from "../chat/alter.jpeg";
import "../globals.css";

const UserMenu = ({ user, onRename, onDelete, onBlock, onUnblock, onClose, isBlocked }) => {
  return (
    <div className="absolute bg-white border rounded-lg shadow-lg z-10 transition-all duration-300 transform scale-95 hover:scale-100">
      <div className="p-2 cursor-pointer hover:bg-gray-200 transition-colors duration-200" onClick={onRename}>Rename</div>
      <div className="p-2 cursor-pointer hover:bg-gray-200 transition-colors duration-200" onClick={onDelete}>Delete</div>
      {isBlocked ? (
        <div className="p-2 cursor-pointer hover:bg-gray-200 transition-colors duration-200" onClick={onUnblock}>Unblock</div>
      ) : (
        <div className="p-2 cursor-pointer hover:bg-gray-200 transition-colors duration-200" onClick={onBlock}>Block</div>
      )}
      <div className="p-2 cursor-pointer hover:bg-gray-200 transition-colors duration-200" onClick={onClose}>Close</div>
    </div>
  );
};

const Chat = () => {
  const [users, setUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newMessage, setNewMessage] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [unreadCounts, setUnreadCounts] = useState({});
  const [menuVisible, setMenuVisible] = useState(false);
  const [menuUser, setMenuUser] = useState(null);
  const [blockedUsers, setBlockedUsers] = useState(new Set());
  const router = useRouter();
  const inputRef = useRef(null);
  const messagesEndRef = useRef(null); // Reference for scrolling

  // Check authentication state and set currentUser
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userDocRef = doc(firestore, "users", user.uid);

        // Update the current user's status to online
        await updateDoc(userDocRef, {
          status: "online",
          lastSeen: serverTimestamp(),
        });

        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          setCurrentUser({ id: user.uid, ...userDoc.data() });
        }

        // Set user offline on disconnect
        const handleBeforeUnload = async () => {
          await updateDoc(userDocRef, {
            status: "offline",
            lastSeen: serverTimestamp(),
          });
        };

        window.addEventListener("beforeunload", handleBeforeUnload);
        return () => {
          window.removeEventListener("beforeunload", handleBeforeUnload);
        };
      } else {
        router.push("/auth");
      }
    });

    return () => unsubscribe();
  }, [router]);

  // Fetch online users in real-time
  useEffect(() => {
    const usersCollection = collection(firestore, "users");
    const q = query(usersCollection, where("status", "==", "online"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const usersData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setUsers(usersData);
    });

    return () => unsubscribe();
  }, []);

  // Fetch messages when a user is selected
// Fetch messages when a user is selected
useEffect(() => {
  if (selectedUser) {
    const userChatId = [auth.currentUser.uid, selectedUser.id].sort().join("_");

    const unsubscribeUserChat = onSnapshot(
      collection(firestore, `chat/${userChatId}/messages`),
      (snapshot) => {
        const messagesData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        
        // Ensure that timestamp exists before filtering/sorting
        const filteredMessages = messagesData.filter(
          (msg) => msg.timestamp && !blockedUsers.has(msg.uid)
        );

        // Sort messages by timestamp
        setMessages(
          filteredMessages.sort((a, b) => a.timestamp.seconds - b.timestamp.seconds)
        );
      }
    );

    return () => unsubscribeUserChat();
  } else {
    setMessages([]);
  }
}, [selectedUser, blockedUsers]);


  // Scroll to the bottom of the chat whenever messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Send a message
  const sendMessage = async () => {
    if (newMessage.trim() && selectedUser && !blockedUsers.has(selectedUser.id)) {
      const userChatId = [auth.currentUser.uid, selectedUser.id].sort().join("_");
      const messagesCollection = collection(firestore, `chat/${userChatId}/messages`);

      try {
        await addDoc(messagesCollection, {
          text: newMessage,
          uid: auth.currentUser.uid,
          timestamp: serverTimestamp(),
        });
        setNewMessage("");
        inputRef.current.focus();
      } catch (error) {
        console.error("Error sending message: ", error);
      }
    }
  };

  // Handle Enter key press
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleUserClick = (user) => {
    setSelectedUser(user);
    setUnreadCounts((prev) => ({ ...prev, [user.id]: 0 }));
  };

  const handleRename = async () => {
    const newName = prompt("Enter new name:", menuUser.name);
    if (newName) {
      const userDocRef = doc(firestore, "users", menuUser.id);
      await updateDoc(userDocRef, { name: newName });
    }
    setMenuVisible(false);
  };

  const handleDelete = async () => {
    const userChatId = [auth.currentUser.uid, selectedUser.id].sort().join("_");
    const messagesCollectionRef = collection(firestore, `chat/${userChatId}/messages`);
    
    const querySnapshot = await onSnapshot(messagesCollectionRef);
    querySnapshot.docs.forEach(async (doc) => {
      await deleteDoc(doc.ref);
    });

    setMessages([]);
    setSelectedUser(null);
    setMenuVisible(false);
  };

  const handleBlock = () => {
    setBlockedUsers((prev) => new Set(prev).add(menuUser.id));
    setMenuVisible(false);
  };

  const handleUnblock = () => {
    setBlockedUsers((prev) => {
      const newBlockedUsers = new Set(prev);
      newBlockedUsers.delete(menuUser.id);
      return newBlockedUsers;
    });
    setMenuVisible(false);
  };

  const handleMenuClick = (user) => {
    setMenuUser(user);
    setMenuVisible((prev) => !prev); // Toggle menu visibility
  };

  const isBlocked = (userId) => {
    return blockedUsers.has(userId);
  };

  return (
    <div className="flex flex-col md:flex-row h-screen bg-gray-100">
      {/* User List Section */}
      <div className={`user-list w-full md:w-1/3 bg-white relative ${selectedUser ? 'hidden md:block' : ''}`}>
        <h2 className="text-lg font-semibold p-4 border-b">Online Users</h2>
        <div className="overflow-y-auto h-full fade-in">
          {users.map((user) => (
            <div
              key={user.id}
              className={`user-item p-4 cursor-pointer hover:bg-gray-200 transition relative ${selectedUser?.id === user.id ? "selected-user" : ""}`}
              onClick={() => handleUserClick(user)}
            >
              <div className="flex items-center">
                <Image
                  src={user.photoURL || Img1}
                  alt={`${user.name}'s profile`}
                  className="w-8 h-8 rounded-full mr-2"
                />
                <span className="mr-2">{user.name}</span>
                {unreadCounts[user.id] > 0 && (
                  <span className="bg-blue-500 text-white rounded-full px-2 text-xs">{unreadCounts[user.id]}</span>
                )}
              </div>
              <div className="absolute right-2 top-2">
                <button className="text-gray-400 hover:text-gray-600" onClick={() => handleMenuClick(user)}>...</button>
                {menuVisible && menuUser.id === user.id && (
                  <UserMenu
                    user={user}
                    onRename={handleRename}
                    onDelete={handleDelete}
                    onBlock={handleBlock}
                    onUnblock={handleUnblock}
                    onClose={() => setMenuVisible(false)}
                    isBlocked={isBlocked(user.id)}
                  />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat Section */}
      <div className="flex-1 flex flex-col bg-white">
        <div className="flex-1 overflow-y-auto p-4">
          <div className="flex flex-col space-y-4">
            {messages.map((msg) => (
              <div key={msg.id} className={`message ${msg.uid === auth.currentUser.uid ? "sent-message" : "received-message"}`}>
                {msg.text}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>

       {/* Input Field */}
<div className="p-2 border-t border-gray-300 bg-gray-50 flex items-center">
  <textarea
    ref={inputRef}
    value={newMessage}
    onChange={(e) => setNewMessage(e.target.value)}
    onKeyDown={handleKeyDown}
    className="flex-grow resize-none border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-400 transition duration-200"
    rows={1}
    placeholder="Type a message..."
  />
  <button
    onClick={sendMessage}
    className="ml-2 bg-blue-500 text-white rounded-lg px-4 py-2 hover:bg-blue-600 transition duration-200"
    disabled={!newMessage.trim()} // Disable button if input is empty
  >
    Send
  </button>
</div>

      </div>
    </div>
  );
};

export default Chat;
