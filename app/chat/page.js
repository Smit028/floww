"use client";
import { useEffect, useState, useRef } from "react";
import { firestore, auth } from "./firebase";
import {
  collection,
  onSnapshot,
  addDoc,
  doc,
  updateDoc,
  serverTimestamp,
  getDoc,
  getDocs,
} from "firebase/firestore";
import {
  FaBars,
  FaUser,
  FaCog,
  FaBell,
  FaPalette,
  FaVideo,
  FaKey,
  FaDatabase,
  FaKeyboard,
  FaInfoCircle,
} from "react-icons/fa";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import UserList from "../components/UserList";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import "../globals.css";
import Img1 from "../chat/alter.jpeg";
import Image from "next/image";
import { query, orderBy, limit } from "firebase/firestore";
import { IoMdPhotos } from "react-icons/io";
import { IoIosArrowBack } from "react-icons/io";

import {
  AiOutlineHome,
  AiOutlinePhone,
  AiOutlineSetting,
} from "react-icons/ai";

export default function Home() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showThirdColumn, setShowThirdColumn] = useState(false);
  const [isSidebarVisible, setIsSidebarVisible] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);

  // Toggle the sidebar visibility
  const toggleSidebar = () => {
    setIsSidebarVisible((prev) => !prev);
  };

  // Function to handle option selection
  const handleOptionSelect = (option) => {
    setSelectedOption(option);
  };

  // Toggle column expanded view
  const toggleColumn = () => {
    setIsExpanded(!isExpanded);
  };

  const contentMap = {
    general: "General settings content here...",
    account: "Account settings content here...",
    chats: "Chat settings content here...",
    video: "Video & voice settings content here...",
    notifications: "Notification settings content here...",
    personalization: "Personalization settings content here...",
    storage: "Storage settings content here...",
    shortcuts: "Shortcut settings content here...",
    help: "Help settings content here...",
  };

  // Go back to second column on mobile
  const goBackToSecondColumn = () => {
    setShowThirdColumn(false);
  };

  const [users, setUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newMessage, setNewMessage] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [unreadCounts, setUnreadCounts] = useState({});
  const [imageFile, setImageFile] = useState(null);
  const router = useRouter();
  const inputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const storage = getStorage();

  // Audio references and flag for send/receive sounds
  const sendSoundRef = useRef(null);
  const receiveSoundRef = useRef(null);
  const isSending = useRef(false); // Flag to control audio playback

  const handleBeforeUnload = () => {
    if (currentUser) {
      updateDoc(doc(firestore, "users", currentUser.id), {
        status: "offline",
        lastSeen: serverTimestamp(),
      });
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        await updateDoc(doc(firestore, "users", user.uid), {
          status: "online",
          lastSeen: serverTimestamp(),
        });
        const userDoc = await getDoc(doc(firestore, "users", user.uid));
        if (userDoc.exists()) {
          setCurrentUser({ id: user.uid, ...userDoc.data() });
        }

        window.addEventListener("beforeunload", handleBeforeUnload);
      } else {
        router.push("/auth");
      }
    });

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      unsubscribe();
    };
  }, [router]);

  const [currentUserId, setCurrentUserId] = useState(null);
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // user is authenticated
        const currentUserId = user.uid; // Get the current user ID
        setCurrentUserId(currentUserId); // Set the user ID in your state or do whatever you need
      } else {
        // user is not authenticated
        setCurrentUserId(null); // Reset or handle when the user is not logged in
      }
    });

    return () => unsubscribe(); // Clean up the listener when component unmounts
  }, []);

  const [usersWithMessages, setUsersWithMessages] = useState([]);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(firestore, "users"),
      async (snapshot) => {
        const usersData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // Update the users state
        setUsers(usersData);

        // Filter users who have messages
        const usersWithMessagesaa = [];

        for (const user of usersData) {
          const userChatId = [currentUserId, user.id].sort().join("_");

          const messagesSnapshot = await getDocs(
            collection(firestore, `chat/${userChatId}/messages`)
          );

          if (!messagesSnapshot.empty) {
            usersWithMessagesaa.push(user);
          }
        }

        // Update the usersWithMessages state
        console.log("aa jo", usersWithMessagesaa);
        setUsersWithMessages(usersWithMessagesaa);
      }
    );

    return () => unsubscribe();
  }, [currentUserId]);

  useEffect(() => {
    if (selectedUser) {
      const userChatId = [auth.currentUser.uid, selectedUser.id]
        .sort()
        .join("_");
      const unsubscribeUserChat = onSnapshot(
        collection(firestore, `chat/${userChatId}/messages`),
        (snapshot) => {
          const messagesData = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          setMessages(
            messagesData.sort(
              (a, b) =>
                (a.timestamp?.seconds || 0) - (b.timestamp?.seconds || 0)
            )
          );
          // Play receive sound only if not sending and a new message is received
          if (
            messagesData.length > messages.length &&
            receiveSoundRef.current &&
            !isSending.current
          ) {
            receiveSoundRef.current.play();
          }
        }
      );

      return () => unsubscribeUserChat();
    }
  }, [selectedUser, messages.length]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (newMessage.trim() && selectedUser) {
      const userChatId = [auth.currentUser.uid, selectedUser.id]
        .sort()
        .join("_");
      try {
        isSending.current = true; // Set isSending flag
        await addDoc(collection(firestore, `chat/${userChatId}/messages`), {
          text: newMessage,
          uid: auth.currentUser.uid,
          timestamp: serverTimestamp(),
          delivered: true,
          seen: false,
        });
        setNewMessage("");
        inputRef.current.focus();

        if (sendSoundRef.current) {
          sendSoundRef.current.play();
          sendSoundRef.current.onended = () => {
            isSending.current = false; // Reset flag when send sound ends
          };
        }
      } catch (error) {
        console.error("Error sending message:", error);
      }
    }
  };

  const sendImage = async () => {
    if (imageFile && selectedUser) {
      const userChatId = [auth.currentUser.uid, selectedUser.id]
        .sort()
        .join("_");
      const messagesCollection = collection(
        firestore,
        `chat/${userChatId}/messages`
      );
      const storageRef = ref(
        storage,
        `chat_images/${Date.now()}_${imageFile.name}`
      );

      try {
        await uploadBytes(storageRef, imageFile);
        const imageUrl = await getDownloadURL(storageRef);
        await addDoc(messagesCollection, {
          imageUrl,
          uid: auth.currentUser.uid,
          timestamp: serverTimestamp(),
          delivered: true,
          seen: false,
        });
        setImageFile(null);

        if (sendSoundRef.current) {
          sendSoundRef.current.play(); // Play sound on sending image
        }
      } catch (error) {
        console.error("Error uploading image:", error);
      }
    }
  };

  const handleUserSelect = async (user) => {
    setSelectedUser(user);
    setUnreadCounts((prev) => ({ ...prev, [user.id]: 0 }));

    // Set the flag to show the third column on mobile
    if (window.innerWidth <= 768) {
      setShowThirdColumn(true); // Show chat section immediately on mobile}
    }

    const userChatId = [auth.currentUser.uid, user.id].sort().join("_");
    const messagesRef = collection(firestore, `chat/${userChatId}/messages`);

    const snapshot = await getDocs(messagesRef);
    snapshot.forEach(async (messageDoc) => {
      const messageData = messageDoc.data();
      if (!messageData.seen && messageData.uid !== auth.currentUser.uid) {
        await updateDoc(messageDoc.ref, { seen: true });
      }
    });
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
    }
  };

  const handleSend = async () => {
    await Promise.all([sendMessage(), sendImage()]);
    setImagePreview(null);
  };

  // voice call

  const handlevoicecall = () => {
    router.push(
      `/VoiceCall?currentUserId=${currentUser.id}&chatUserId=${selectedUser.id}`
    );
  };

  const [usersWithLastMessages, setUsersWithLastMessages] = useState([]);
  useEffect(() => {
    const fetchUsersWithLastMessage = async () => {
      const usersData = []; // To store users data
      const usersWithMessages = [];

      // Fetch all users
      const usersSnapshot = await getDocs(collection(firestore, "users"));
      usersSnapshot.forEach((doc) => {
        usersData.push({ id: doc.id, ...doc.data() });
      });

      // For each user, get the last message
      for (const user of usersData) {
        const userChatId = [auth.currentUser.uid, user.id].sort().join("_");

        // Get the last message (latest one based on timestamp)
        const messagesQuery = query(
          collection(firestore, `chat/${userChatId}/messages`),
          orderBy("timestamp", "desc"),
          limit(1)
        );

        const messagesSnapshot = await getDocs(messagesQuery);

        if (!messagesSnapshot.empty) {
          const lastMessage = messagesSnapshot.docs[0].data();

          usersWithMessages.push({
            ...user,
            lastMessage: lastMessage.text || "No message", // Handle case when there's no message
            timestamp: lastMessage.timestamp,
            seen: lastMessage.seen ? "seen" : "unseen",
          });
        }
      }

      setUsers(usersData); // Set the full list of users
      setUsersWithLastMessages(usersWithMessages); // Set users with their last messages
    };

    fetchUsersWithLastMessage();
  }, []);

  const [imagePreview, setImagePreview] = useState(null);


  const handleRemovePreview = () => {
    setImagePreview(null);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <audio
        ref={sendSoundRef}
        src="https://media.memesoundeffects.com/2022/03/WhatsApp-Sending-Message-Sound-Effect.mp3"
        preload="auto"
        onError={(e) => console.error("Error loading send sound:", e)}
      />
      <audio
        ref={receiveSoundRef}
        src="https://sounddino.com/mp3/44/incoming-message-online-whatsapp.mp3"
        preload="auto"
        onError={(e) => console.error("Error loading receive sound:", e)}
      />

      {/* Full-Width Header */}
      <header className="w-full bg-[#202020] text-white">
        <h1 className="text-center text-lg p-2">Floww</h1>
      </header>

      {/* Main Content Area with Columns */}
      <div className="flex flex-1 bg-white relative flex-col lg:flex-row">
        {/* Sidebar Column (Hidden on mobile) */}
        <div
          className={`bg-[#202020] min-h-full z-10 p-4 shadow-lg transition-all duration-300 ${
            isExpanded ? "lg:w-[200px]" : "lg:w-[50px]"
          } flex flex-col items-start lg:block hidden`}
        >
          {/* Sandwich Button (Expand/Collapse button) */}
          <button
            onClick={toggleColumn}
            aria-label="Expand or collapse sidebar"
            className="bg-[#3b3b3b] hover:bg-[#5a5a5a] text-white p-2 rounded focus:outline-none flex items-center justify-center w-10 h-10 mt-2 ml-[-11px] transition-colors duration-200"
          >
            ☰
          </button>

          {/* Menu Items */}
          <ul className="flex flex-col items-start space-y-2 mt-4 flex-grow">
            <li className="text-white py-2 flex items-center w-full hover:bg-[#444444] rounded-md transition-colors duration-200">
              <AiOutlineHome className="text-xl" />
              {isExpanded && <span className="text-white ml-2">Home</span>}
            </li>
            <li className="text-white py-2 flex items-center w-full hover:bg-[#444444] rounded-md transition-colors duration-200">
              <AiOutlinePhone className="text-xl" />
              {isExpanded && <span className="text-white ml-2">Contacts</span>}
            </li>
            <li className="text-white py-2 flex items-center w-full hover:bg-[#444444] rounded-md transition-colors duration-200">
              <AiOutlineSetting className="text-xl" />
              {isExpanded && <span className="text-white ml-2">Settings</span>}
            </li>

            {/* Profile Section */}
            <li className="text-white flex items-center w-full hover:bg-[#444444] rounded-md transition-colors duration-200">
              <div className="cursor-pointer" onClick={toggleSidebar}>
                <Image
                  src={Img1}
                  alt="Profile Picture"
                  width={30}
                  height={30}
                  className="rounded-full"
                />
              </div>
              {isExpanded && <span className="text-white ml-2">Profile</span>}
            </li>
          </ul>
        </div>

        {/* 30% Width Column */}
        <div
          className={`${
            showThirdColumn ? "hidden" : "block"
          } w-full lg:w-[30%] bg-gray-200 overflow-x-hidden`}
        >
          <UserList
            users={usersWithMessages}
            selectedUser={selectedUser}
            totalusers={users}
            onUserSelect={handleUserSelect}
            className="w-full md:w-1/4 lg:w-1/5 border-r border-gray-300 bg-white h-full overflow-y-auto shadow-lg"
            currentUser={currentUser}
            // usersWithLastMessages={usersWithLastMessages}
          />
        </div>

        {/* 70% Width Column */}
        <div
          className={`${
            showThirdColumn ? "block" : "hidden"
          } w-full lg:w-[70%] text-[#1E1E1E] lg:block`} // Set the background color here
        >
          {selectedUser && (
            <div className="flex-1 flex flex-col bg-white h-full">
              <div className="p-4 border-b border-gray-300 text-[#1E1E1E] flex items-center  rounded-t-lg shadow-lg">
                {/* Back Button (Only on Mobile) */}
                {window.innerWidth < 768 && (
                  <button
                    onClick={goBackToSecondColumn}
                    className="text-[#1E1E1E] hover:text-[#4b4b4b] mr-2 transition-all duration-200 ease-in-out transform hover:scale-105"
                  >
                    <IoIosArrowBack size={20} />
                  </button>
                )}

                {/* Profile Image of Selected User */}
                <img
                  src={selectedUser.photoURL || Img1.src} // Use selected user's photo or a default image
                  alt={`${selectedUser.name}'s profile`}
                  className="w-10 h-10 rounded-full border-2 border-white shadow-md mr-3"
                />

                {/* User's Name */}
                <h3 className="text-xl font-semibold text-[#1E1E1E] truncate max-w-xs logo">
                  {selectedUser.name}
                </h3>

                {/* Call Button */}
                <button
                  onClick={() => handlevoicecall()}
                  className="ml-auto text-[#1E1E1E] hover:text-[#4b4b4b] transition-all duration-200 ease-in-out transform hover:scale-105"
                >
                  Call
                </button>
              </div>

              <div className="flex-1 overflow-y-auto  max-h-[calc(100vh-200px)] scrollbar-thin scrollbar-thumb-gray-[#D8FF75] scrollbar-track-gray-300 scrollbar-thumb-rounded-full scrollbar-track-rounded-full">
                <div className="flex flex-col space-y-4 p-4">
                  {messages.map((msg) => {
                    const messageUser = users.find(
                      (user) => user.id === msg.uid
                    );
                    const messageTime = new Date(
                      msg.timestamp?.seconds * 1000
                    ).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    });

                    return (
                      <div
                        key={msg.id}
                        className={`flex items-start space-x-3 ${
                          msg.uid === auth.currentUser.uid ? "justify-end" : ""
                        }`}
                      >
                        <div></div>
                        <div
                          className={`p-2 rounded-lg shadow-sm max-w-xs ${
                            msg.uid === auth.currentUser.uid
                              ? "bg-[#1E1E1E] text-white self-end" // Sent message background color
                              : "bg-[#D8FF75] text-[#1E1E1E] self-start" // Received message background color
                          } flex flex-col`}
                          style={{
                            wordWrap: "break-word",
                            overflowWrap: "break-word",
                          }} // Allow text wrapping
                        >
                          <div className="flex-1">
                            {msg.imageUrl ? (
                              <img
                                src={msg.imageUrl}
                                alt="Sent"
                                className="rounded-md mb-1"
                              />
                            ) : (
                              <span className="block mb-1">{msg.text}</span>
                            )}
                          </div>
                          <div className="flex justify-end items-center space-x-1 text-[10px] text-gray-400">
                            <span>{messageTime}</span>
                            {msg.uid === auth.currentUser.uid && ( // Only show ticks for the sender's messages
                              <span
                                className={`ml-1 ${
                                  msg.seen ? "text-[#36ff86]" : "text-gray-50"
                                }`}
                              >
                                {msg.seen ? "✓✓" : "✓"}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  <div ref={messagesEndRef} />
                </div>
              </div>

     <div className="flex flex-col ">
                  <div className="absolute bottom-20 md:w-full ">
                         {/* Image Preview Box */}
                         {imagePreview && (
            <div className="flex items-center space-x-2 p-4 border-t border-gray-300 bg-gray-100 relative l justify-center align-middle items-center">
              <img
                src={imagePreview}
                alt="Preview"
                className="w-20 h-20 rounded-md object-cover"
              />
              <button
                onClick={handleRemovePreview}
                className="text-[#ff4b4b] hover:text-[#ff0000] transition duration-200 absolute top-0 right-0"
              >
                Remove
              </button>
            </div>
          )}
</div>
              <div className="absolute w-[-webkit-fill-available] bottom-0 p-2 mb-4 border-t border-gray-300 text-[#2A2A2A] flex items-center space-x-2 shadow-[0_-5px_15px_rgba(0,0,0,0.1)]">
    

                <textarea
                  ref={inputRef}
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type your message..."
                  className="flex-1 p-3 border rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-[#0077cc] text-[#1E1E1E] bg-[#f4f4f4] transition-all duration-300 ease-in-out"
                  rows="1"
                />

                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                  id="image-upload"
                />
                <label
                  htmlFor="image-upload"
                  className="p-2 text-[#1E1E1E] cursor-pointer hover:text-[#005fa3]"
                >
                  <IoMdPhotos size={30} />
                </label>
                <button
                  onClick={handleSend}
                  className="bg-[#1E1E1E] hover:bg-[#005fa3] text-white p-2 rounded-md"
                >
                  Send
                </button>
              </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <div
        className={`fixed bottom-0 left-20 bg-gray-800 text-white w-[500px] p-4 flex  transition-transform duration-500  ease-in-out ${
          isSidebarVisible
            ? "transform translate-y-0"
            : "transform translate-y-full"
        } w-64 rounded-t-lg shadow-lg`}
      >
        <div>
          {/* Sidebar Items */}
          <div className="space-y-4">
            {[
              {
                icon: <FaCog className="text-xl" />,
                label: "General",
                value: "general",
              },
              {
                icon: <FaKey className="text-xl" />,
                label: "Account",
                value: "account",
              },
              {
                icon: <FaUser className="text-xl" />,
                label: "Chats",
                value: "chats",
              },
              {
                icon: <FaVideo className="text-xl" />,
                label: "Video & voice",
                value: "video",
              },
              {
                icon: <FaBell className="text-xl" />,
                label: "Notifications",
                value: "notifications",
              },
              {
                icon: <FaPalette className="text-xl" />,
                label: "Personalization",
                value: "personalization",
              },
              {
                icon: <FaDatabase className="text-xl" />,
                label: "Storage",
                value: "storage",
              },
              {
                icon: <FaKeyboard className="text-xl" />,
                label: "Shortcuts",
                value: "shortcuts",
              },
              {
                icon: <FaInfoCircle className="text-xl" />,
                label: "Help",
                value: "help",
              },
            ].map((item, index) => (
              <div
                key={index}
                className="flex items-center space-x-2 cursor-pointer"
                onClick={() => handleOptionSelect(item.value)} // Call the function with the value
              >
                {/* Icon */}
                {item.icon}
                {/* Label */}
                <span className="text-sm font-medium">{item.label}</span>
              </div>
            ))}
          </div>

          {/* Profile Button at the Bottom */}
          <div className="mt-auto flex items-center space-x-2 cursor-pointer">
            <FaUser className="text-xl" />
            <span className="text-sm font-medium">Profile</span>
          </div>
        </div>
        <div className="w-[300px]">
          {selectedOption && (
            <div className="bg-gray-800 rounded-lg w-full h-full">
              <h3 className="text-xl font-semibold">
                {selectedOption.charAt(0).toUpperCase() +
                  selectedOption.slice(1)}{" "}
                Settings
              </h3>
              <p className="mt-2">{contentMap[selectedOption]}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
