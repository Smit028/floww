"use client";
import "../globals.css";
import { useEffect, useState, useRef } from "react";
import { firestore, auth } from "../firebase/firebase";
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
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import UserList from "../components/UserList";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import "../globals.css";
import Img1 from "../chat/alter.jpeg";
import { getMessaging, onMessage } from "firebase/messaging";
import VoiceCall from "../demo1/VoiceCall";
import Image from "next/image";

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
import profilePic from "../chat/alter.jpeg";

export default function Home() {
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

  // Content mapping for the selected option
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
  const [isExpanded, setIsExpanded] = useState(false);
  const [showThirdColumn, setShowThirdColumn] = useState(false);

  // Toggle column expanded view
  const toggleColumn = () => {
    setIsExpanded(!isExpanded);
  };

  // Navigate to third column on mobile
  const navigateToThirdColumn = () => {
    setShowThirdColumn(true);
  };

  // Go back to second column on mobile
  const goBackToSecondColumn = () => {
    setShowThirdColumn(false);
  };

  // cchatt

  const [users, setUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newMessage, setNewMessage] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const router = useRouter();
  const inputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const storage = getStorage();
  const [unreadCounts, setUnreadCounts] = useState({});
  const [remotePeerId, setRemotePeerId] = useState("");
  const [showCallControls, setShowCallControls] = useState(false);

  // Audio references and flag for send/receive sounds
  const sendSoundRef = useRef(
    new Audio(
      "https://media.memesoundeffects.com/2022/03/WhatsApp-Sending-Message-Sound-Effect.mp3"
    )
  );
  const receiveSoundRef = useRef(
    new Audio(
      "https://sounddino.com/mp3/44/incoming-message-online-whatsapp.mp3"
    )
  );
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

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(firestore, "users"),
      (snapshot) => {
        const usersData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setUsers(usersData);
      }
    );
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const messaging = getMessaging();
    onMessage(messaging, (payload) => {
      console.log("Message received:", payload);
      alert(`New message: ${payload.notification.body}`);
    });
  }, []);

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
        isSending.current = true;
        await addDoc(collection(firestore, `chat/${userChatId}/messages`), {
          text: newMessage,
          uid: auth.currentUser.uid,
          timestamp: serverTimestamp(),
          delivered: true,
          seen: false,
        });
        setNewMessage("");
        inputRef.current.focus();
        sendSoundRef.current.play();
      } catch (error) {
        console.error("Error sending message:", error);
      } finally {
        isSending.current = false;
      }
    }
  };

  const sendImage = async () => {
    if (imageFile && selectedUser) {
      const userChatId = [auth.currentUser.uid, selectedUser.id]
        .sort()
        .join("_");
      const storageRef = ref(
        storage,
        `chat_images/${Date.now()}_${imageFile.name}`
      );
      try {
        await uploadBytes(storageRef, imageFile);
        const imageUrl = await getDownloadURL(storageRef);
        await addDoc(collection(firestore, `chat/${userChatId}/messages`), {
          imageUrl,
          uid: auth.currentUser.uid,
          timestamp: serverTimestamp(),
          delivered: true,
          seen: false,
        });
        setImageFile(null);
        sendSoundRef.current.play();
      } catch (error) {
        console.error("Error uploading image:", error);
      }
    }
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
    }
  };

  // Initialize a connection (simplified)
  let localStream;
  let peerConnection;

  // Function to accept a call
  const acceptCall = (offer) => {
    peerConnection = new RTCPeerConnection();

    // Add event listeners for receiving tracks
    peerConnection.ontrack = (event) => {
    };

    peerConnection
      .setRemoteDescription(new RTCSessionDescription(offer))
      .then(() => {
        return peerConnection.createAnswer();
      })
      .then((answer) => {
        return peerConnection.setLocalDescription(answer);
      })
      .then(() => {
        // Send the answer back to the caller
        sendAnswerToCaller(peerConnection.localDescription);
      })
      .catch((error) => {
        console.error("Error during call acceptance.", error);
      });
  };

  // Function to handle call ending
  const endCall = () => {
    if (peerConnection) {
      peerConnection.close();
      peerConnection = null;
    }
  };

  const handlevoicecall = () => {
    router.push(
      `/demo1?currentUser=${currentUser.id}&chatUser=${selectedUser.id}&currentUserName=${currentUser.name}&chatUserName=${selectedUser.name}`
    );
    console.log(currentUser);
  };
  const initiateCall = () => {
    if (remotePeerId) {
      VoiceCall.startCall(remotePeerId);
    } else {
      console.error("No peer ID found for the selected user.");
    }
  };

  const handleVoiceCall = () => {
    setShowCallControls(true); //
  };

  const handleUserSelect = (user) => {
    setSelectedUser(user);
    setShowCallControls(false);
  };

  return (
    <div className="flex flex-col h-screen">
      {/* Full-Width Header */}
      <header className="w-full bg-[#202020] text-white">
        <h1 className="text-center text-lg p-2">My Full-Width Header</h1>
      </header>

      {/* Main Content Area with Columns */}
      <div className="flex flex-1 bg-gray-100 relative flex-col lg:flex-row">
        {/* Sidebar Column (Hidden on mobile) */}
        <div className={`hidden lg:w-[50px] bg-[#202020] relative lg:block`}>
          {/* Sandwich Button */}
          <button
            onClick={toggleColumn}
            aria-label="Expand or collapse sidebar"
            className="absolute top-2 left-2 bg-gray-500 text-white p-1 rounded focus:outline-none z-20"
          >
            ☰
          </button>

          {/* Expandable Overlay */}
          <div
            className={`absolute top-0 left-0 w-[200px] h-full bg-gray-700 z-10 p-4 shadow-lg transition-transform duration-300 ${
              isExpanded ? "translate-x-0" : "-translate-x-full"
            }`}
          >
            <button
              onClick={toggleColumn}
              aria-label="Close expanded sidebar"
              className="absolute top-2 right-2 bg-gray-500 text-white p-1 rounded focus:outline-none"
            >
              ✕
            </button>
            <div
              className="fixed bottom-4 left-4 cursor-pointer"
              onClick={toggleSidebar}
            >
              <Image
                src={profilePic}
                alt="Profile Picture"
                width={60}
                height={60}
                className="rounded-full w-[50px] h-[50px]"
              />
            </div>
          </div>
        </div>

        <div
          className={`fixed bottom-0 left-20 bg-gray-800 w-[500px] p-4 flex  transition-transform duration-500  ease-in-out ${
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

        {/* 30% Width Column */}
        <div
          className={`${
            showThirdColumn ? "hidden" : "block"
          } w-full lg:w-[30%] bg-gray-200`}
        >
          <UserList
            users={users}
            selectedUser={selectedUser}
            onUserSelect={handleUserSelect}
            className="w-full md:w-1/4 lg:w-1/5 border-r border-gray-300 bg-white h-full overflow-y-auto shadow-lg"
            currentUser={currentUser}
          />
          {/* Button to navigate to the third column on mobile */}
          <button
            onClick={navigateToThirdColumn}
            className="mt-2 bg-blue-500 text-white p-2 rounded lg:hidden"
            aria-label="Go to third column"
          >
            Go to Third Column
          </button>
        </div>

        {/* 70% Width Column */}
        <div
          className={`${
            showThirdColumn ? "block" : "hidden"
          } w-full lg:w-[70%] bg-gray-300 lg:block`}
        >
          {/* Back button only on mobile */}
          <button
            onClick={goBackToSecondColumn}
            className="bg-blue-500 text-white p-2 rounded lg:hidden"
            aria-label="Back to second column"
          >
            Back to Second Column
          </button>
          {selectedUser && (
            <div className="flex flex-col h-screen w-full bg-white shadow-lg rounded-lg">
              {/* Chat Header */}
              <div className="p-4 border-b border-gray-300 bg-[#454545] text-white flex items-center">
                {window.innerWidth < 768 && (
                  <button
                    onClick={() => setSelectedUser(null)}
                    className="text-white mr-2"
                  >
                    ← Back
                  </button>
                )}
                <Image
                  src={selectedUser?.photoURL || Img1}
                  alt={`${selectedUser?.name || "Default"}'s profile`}
                  width={50}
                  height={50}
                  className="w-[50px] h-[50px] rounded-full object-cover"
                />
                <h3 className="text-lg font-semibold">{selectedUser.name}</h3>
                <button
                  onClick={handleVoiceCall}
                  className="ml-auto bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded transition"
                >
                  Call
                </button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto bg-gray-50 p-4 space-y-4">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${
                      msg.uid === currentUser.id
                        ? "justify-end"
                        : "justify-start"
                    }`}
                  >
                    <div
                      className={`p-2 rounded-lg shadow-sm ${
                        msg.uid === currentUser.id
                          ? "bg-[#005C4B]"
                          : "bg-[#  676364]"
                      } max-w-xs`}
                    >
                      {msg.imageUrl ? (
                        <img
                          src={msg.imageUrl}
                          alt="Sent"
                          className="rounded-md mb-1 max-h-40"
                        />
                      ) : (
                        <span className="block mb-1">{msg.text}</span>
                      )}
                      <div className="text-[10px] text-gray-200 text-right">
                        {new Date(
                          msg.timestamp?.seconds * 1000
                        ).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="p-4 border-t border-gray-300 bg-gray-50 flex items-center">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                  id="imageUpload"
                />
                <label
                  htmlFor="imageUpload"
                  className="bg-blue-500 text-white px-3 py-2 rounded cursor-pointer hover:bg-blue-600 transition"
                >
                  📷
                </label>
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 border border-gray-300 rounded-md p-2 ml-2 resize-none h-12"
                />
                <button
                  onClick={sendMessage}
                  className="bg-blue-500 text-white px-4 py-2 rounded ml-2 hover:bg-blue-600 transition"
                >
                  Send
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
