import React, { useState, useEffect } from "react";
import Link from "next/link";
import img1 from "./alter2.jpeg";
import {
  getDocs,
  query,
  collection,
  orderBy,
  limit,
  onSnapshot,
} from "firebase/firestore";
import { auth, firestore } from "../chat/firebase";

const UserList = ({ users, selectedUser, onUserSelect, unreadCounts }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [usersWithLastMessages, setUsersWithLastMessages] = useState([]);

  useEffect(() => {
    const fetchUsersWithLastMessage = async () => {
      const usersData = [];
      const usersSnapshot = await getDocs(collection(firestore, "users"));
      usersSnapshot.forEach((doc) => {
        usersData.push({ id: doc.id, ...doc.data() });
      });

      const unsubscribeFns = usersData.map((user) => {
        const userChatId = [auth.currentUser.uid, user.id].sort().join("_");

        const messagesQuery = query(
          collection(firestore, `chat/${userChatId}/messages`),
          orderBy("timestamp", "desc"),
          limit(1)
        );

        const unsubscribe = onSnapshot(messagesQuery, (messagesSnapshot) => {
          if (!messagesSnapshot.empty) {
            const lastMessage = messagesSnapshot.docs[0].data();
            const hasNewMessage =
              lastMessage.timestamp &&
              lastMessage.timestamp.toMillis() > (user.lastChecked || 0);

            const updatedUser = {
              ...user,
              lastMessage: lastMessage.text || "No message",
              timestamp: lastMessage.timestamp,
              seen: lastMessage.seen ? "Seen" : "Unseen",
              hasNewMessage,
              isMyMessage: lastMessage.senderId === auth.currentUser.uid,
            };

            setUsersWithLastMessages((prevState) => {
              const userIndex = prevState.findIndex((u) => u.id === user.id);
              if (userIndex >= 0) {
                const updatedUsers = [...prevState];
                updatedUsers[userIndex] = updatedUser;
                return updatedUsers;
              }
              return [...prevState, updatedUser];
            });
          }
        });

        return unsubscribe;
      });

      return () => {
        unsubscribeFns.forEach((unsubscribe) => unsubscribe());
      };
    };

    fetchUsersWithLastMessage();
  }, []);

  useEffect(() => {
    const uniqueUsers = users
      .filter((user) => user?.email)
      .filter(
        (user, index, self) =>
          index === self.findIndex((u) => u.email === user.email)
      );

    const visibleUsers = uniqueUsers.filter(
      (user) =>
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const sortedUsers = visibleUsers.sort((a, b) => {
      const aLastMessage = usersWithLastMessages.find((u) => u.id === a.id);
      const bLastMessage = usersWithLastMessages.find((u) => u.id === b.id);
      return (
        (bLastMessage?.timestamp?.seconds || 0) -
        (aLastMessage?.timestamp?.seconds || 0)
      );
    });

    setFilteredUsers(sortedUsers);
  }, [users, searchQuery, usersWithLastMessages]);

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return "";
  
    const messageDate = new Date(timestamp.seconds * 1000);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
  
    const isToday =
      messageDate.getDate() === today.getDate() &&
      messageDate.getMonth() === today.getMonth() &&
      messageDate.getFullYear() === today.getFullYear();
  
    const isYesterday =
      messageDate.getDate() === yesterday.getDate() &&
      messageDate.getMonth() === yesterday.getMonth() &&
      messageDate.getFullYear() === yesterday.getFullYear();
  
    if (isToday) {
      // Display time if the message is from today
      const hours = messageDate.getHours().toString().padStart(2, "0");
      const minutes = messageDate.getMinutes().toString().padStart(2, "0");
      return `${hours}:${minutes}`;
    } else if (isYesterday) {
      // Display "Yesterday" if the message is from the previous day
      return "Yesterday";
    } else {
      // Display the date in DD/MM/YYYY format if the message is older than one day
      const day = messageDate.getDate().toString().padStart(2, "0");
      const month = (messageDate.getMonth() + 1).toString().padStart(2, "0");
      const year = messageDate.getFullYear();
      return `${day}/${month}/${year}`;
    }
  };
  

  return (
    <div className="w-full border-r border-gray-300 bg-gray-50 h-full flex flex-col transition-all duration-500 ease-in-out">
      <div className="p-4 flex justify-between items-center border-b">
        <h2 className="font-semibold text-lg">Users</h2>
        <Link href={"/profile"}>
          <button className="text-blue-500 hover:underline">
            Edit Profile
          </button>
        </Link>
      </div>

      <div className="p-4">
        <input
          type="text"
          placeholder="Search user..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-300 ease-in-out text-black"
        />
      </div>

      <ul className="flex-1 overflow-y-auto max-h-[calc(100vh-200px)]">
        {filteredUsers.map((user, index) => {
          const lastMessage = usersWithLastMessages.find(
            (u) => u.id === user.id
          );
          const lastMessageText = lastMessage
            ? lastMessage.lastMessage
            : "No message";
          const lastMessageTime = lastMessage
            ? formatTimestamp(lastMessage.timestamp)
            : "";
          const seenStatus = lastMessage ? lastMessage.seen : "";

          return (
            <li
              key={user.id}
              onClick={() => onUserSelect(user)}
              className={`p-4 cursor-pointer transition-all text-black transform duration-300 ease-in-out hover:bg-gray-200 ${
                selectedUser?.id === user.id ? "bg-blue-100" : ""
              }`}
              style={{
                transitionProperty: "transform, opacity",
                opacity: 1,
                transform: `translateY(${index * 10}px)`,
              }}
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <img
                    src={user.photoURL || img1.src}
                    alt={user.name}
                    className="w-12 h-12 rounded-full mr-4"
                  />
                  <div className="flex flex-col justify-center">
                    <span className="font-semibold">{user.name}</span>
                    <span className="text-sm text-gray-500">
                      {lastMessageText}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col items-end">
                  <span className="text-xs text-gray-400">
                    {lastMessageTime}
                  </span>
                  {lastMessage &&
                    !lastMessage.isMyMessage && // Last message not from current user
                    !lastMessage.seen && // Last message not seen by the current user
                    (
                      <span
                        className={`w-5 h-5 rounded-full bg-green-500 mt-1 text-xs text-center text-white flex items-center justify-center ${
                          lastMessage.hasNewMessage ? "animate-pulse" : ""
                        }`}
                      >
                        U
                      </span>
                    )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default UserList;
