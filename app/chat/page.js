"use client";
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
import Img1 from "./alter.jpeg";
import { getMessaging, onMessage } from "firebase/messaging";
import VoiceCall from "../demo1/VoiceCall";
const Chat = () => {
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
  const sendSoundRef = useRef(new Audio("https://media.memesoundeffects.com/2022/03/WhatsApp-Sending-Message-Sound-Effect.mp3"));
  const receiveSoundRef = useRef(new Audio("https://sounddino.com/mp3/44/incoming-message-online-whatsapp.mp3"));
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
    const unsubscribe = onSnapshot(collection(firestore, "users"), (snapshot) => {
      const usersData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setUsers(usersData);
    });
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
      const userChatId = [auth.currentUser.uid, selectedUser.id].sort().join("_");
      const unsubscribeUserChat = onSnapshot(collection(firestore, `chat/${userChatId}/messages`), (snapshot) => {
        const messagesData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setMessages(messagesData.sort((a, b) => (a.timestamp?.seconds || 0) - (b.timestamp?.seconds || 0)));

        if (messagesData.length > messages.length && receiveSoundRef.current && !isSending.current) {
          receiveSoundRef.current.play();
        }
      });
      return () => unsubscribeUserChat();
    }
  }, [selectedUser, messages.length]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (newMessage.trim() && selectedUser) {
      const userChatId = [auth.currentUser.uid, selectedUser.id].sort().join("_");
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
      const userChatId = [auth.currentUser.uid, selectedUser.id].sort().join("_");
      const storageRef = ref(storage, `chat_images/${Date.now()}_${imageFile.name}`);
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

  // const handleUserSelect = async (user) => {
  //   setSelectedUser(user);
  //   setUnreadCounts((prev) => ({ ...prev, [user.id]: 0 }));

  //   const userChatId = [auth.currentUser.uid, user.id].sort().join("_");
  //   const messagesRef = collection(firestore, `chat/${userChatId}/messages`);

  //   const snapshot = await getDocs(messagesRef);
  //   snapshot.forEach(async (messageDoc) => {
  //     const messageData = messageDoc.data();
  //     if (!messageData.seen && messageData.uid !== auth.currentUser.uid) {
  //       await updateDoc(messageDoc.ref, { seen: true });
  //     }
  //   });
  // };

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

// Function to initiate a call
// const initiateCall = (recipientId) => {
//     // Request access to the microphone
//     navigator.mediaDevices.getUserMedia({ audio: true })
//         .then(stream => {
//             localStream = stream;
//             // Display local stream (if video)
//             // Example: localVideo.srcObject = stream;

//             // Create a new peer connection
//             peerConnection = new RTCPeerConnection();

//             // Add local stream tracks to the connection
//             localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

//             // Create an offer and send it to the recipient
//             return peerConnection.createOffer();
//         })
//         .then(offer => {
//             return peerConnection.setLocalDescription(offer);
//         })
//         .then(() => {
//             // Send the offer to the recipient using your signaling method (e.g., Firebase)
//             sendOfferToRecipient(recipientId, peerConnection.localDescription);
//         })
//         .catch(error => {
//             console.error('Error accessing media devices.', error);
//         });
// };

// Function to accept a call
const acceptCall = (offer) => {
    peerConnection = new RTCPeerConnection();

    // Add event listeners for receiving tracks
    peerConnection.ontrack = (event) => {
        // Display incoming stream (if video)
        // Example: remoteVideo.srcObject = event.streams[0];
    };

    // Set the remote description and create an answer
    peerConnection.setRemoteDescription(new RTCSessionDescription(offer))
        .then(() => {
            return peerConnection.createAnswer();
        })
        .then(answer => {
            return peerConnection.setLocalDescription(answer);
        })
        .then(() => {
            // Send the answer back to the caller
            sendAnswerToCaller(peerConnection.localDescription);
        })
        .catch(error => {
            console.error('Error during call acceptance.', error);
        });
};


// Function to handle call ending
const endCall = () => {
    if (peerConnection) {
        peerConnection.close();
        peerConnection = null;
    }
    // Handle UI updates, notify the other party, etc.
};


const handlevoicecall = () =>{
  // router.push({
  //   pathname:"/demo1",
  //   query: {
  //     currentUserId: currentUser.id,
  //     currentUserName: currentUser.name,
  //     currentUserPhotoURL: currentUser.photoURL,
  //     chatUserId: users.id,
  //     chatUserName: users.name,
  //     chatUserPhotoURL: users.photoURL,
  //   },
  // }); 
  router.push(`/demo1?currentUser=${currentUser.id}&chatUser=${selectedUser.id}&currentUserName=${currentUser.name}&chatUserName=${selectedUser.name}`)
  console.log(currentUser);
}

// const handleUserSelect = (user) => {
//   setSelectedUser(user);
//   setRemotePeerId(user.peerId); // Assume each user has a unique peerId
// };

const initiateCall = () => {
  if (remotePeerId) {
      VoiceCall.startCall(remotePeerId); // Initiate call by calling startCall function from VoiceCall
  } else {
      console.error("No peer ID found for the selected user.");
  }
};

const handleVoiceCall = () => {
  setShowCallControls(true); // Show call controls when the call button is clicked
};

const handleUserSelect = (user) => {
  setSelectedUser(user);
  setShowCallControls(false); // Hide call controls when a new user is selected
  // Load messages for the selected user
};


return (
    <div className="flex flex-col md:flex-row h-screen w-full bg-gray-100">
      {/* User List Section */}
      {(!selectedUser || window.innerWidth >= 1024) && (
        <UserList
          users={users}
          selectedUser={selectedUser}
          onUserSelect={handleUserSelect}
          className="w-full md:w-1/4 lg:w-1/5 border-r border-gray-300 bg-white h-full overflow-y-auto shadow-lg"
          currentUser={currentUser}
        />
      )}

      {/* Chat Area */}
      {selectedUser && (
        <div className="flex flex-col w-full md:w-3/5 lg:w-3/5 h-full bg-white shadow-lg rounded-lg">
          {/* Chat Header */}
          <div className="p-4 border-b border-gray-300 bg-blue-500 text-white flex items-center">
            {window.innerWidth < 768 && (
              <button onClick={() => setSelectedUser(null)} className="text-white mr-2">
                ← Back
              </button>
            )}
            <img
              src={selectedUser.photoURL || Img1}
              alt={`${selectedUser.name}'s profile`}
              className="w-8 h-8 rounded-full mr-3"
            />
            <h3 className="text-lg font-semibold">{selectedUser.name}</h3>
            <button onClick={handleVoiceCall} className="ml-auto bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded transition">
              Call
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto bg-gray-50 p-4 space-y-4">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.uid === currentUser.id ? "justify-end" : "justify-start"}`}>
                <div className={`p-2 rounded-lg shadow-sm ${msg.uid === currentUser.id ? "bg-green-200" : "bg-gray-300"} max-w-xs`}>
                  {msg.imageUrl ? (
                    <img src={msg.imageUrl} alt="Sent" className="rounded-md mb-1 max-h-40" />
                  ) : (
                    <span className="block mb-1">{msg.text}</span>
                  )}
                  <div className="text-xs text-gray-500 text-right">
                    {new Date(msg.timestamp?.seconds * 1000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <div className="p-4 border-t border-gray-300 bg-gray-50 flex items-center">
            <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" id="imageUpload" />
            <label htmlFor="imageUpload" className="bg-blue-500 text-white px-3 py-2 rounded cursor-pointer hover:bg-blue-600 transition">
              📷
            </label>
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 border border-gray-300 rounded-md p-2 ml-2 resize-none h-12"
            />
            <button onClick={sendMessage} className="bg-blue-500 text-white px-4 py-2 rounded ml-2 hover:bg-blue-600 transition">
              Send
            </button>
          </div>
        </div>
      )}

      {/* Call Controls Section */}
      {selectedUser && showCallControls && (
        <div className="hidden lg:flex flex-col w-1/5 h-full border-l border-gray-300 bg-white p-4 shadow-md">
          <h3 className="text-lg font-semibold mb-2">Call Controls</h3>
          <VoiceCall 
            currentUserId={currentUser.id} 
            chatUserId={selectedUser.id} 
            currentUserName={currentUser.name} 
            chatUserName={selectedUser.name} 
          />
        </div>
      )}
    </div>
  );

};

export default Chat;
