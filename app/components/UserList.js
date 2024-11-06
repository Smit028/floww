import React, { useState, useEffect } from "react";
import { FaBell } from "react-icons/fa"; // Import bell icon from react-icons
import Image from "next/image";
import Img1 from "../chat/alter.jpeg";

const UserList = ({ users, selectedUser, onUserSelect, unreadCounts = {}, setUnreadCounts }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredUsers, setFilteredUsers] = useState([]);

  useEffect(() => {
    // Filter and remove duplicate users based on email
    const visibleUsers = users
      .filter((user) => user?.email) // Filter out null entries
      .filter(
        (user, index, self) =>
          index === self.findIndex((u) => u.email === user.email)
      )
      .filter(
        (user) =>
          user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.email.toLowerCase().includes(searchQuery.toLowerCase())
      );

    // Sort users by last message time (assuming user has lastMessageTime property)
    visibleUsers.sort((a, b) => new Date(b.lastMessageTime) - new Date(a.lastMessageTime));

    setFilteredUsers(visibleUsers);
  }, [users, searchQuery]);

  const handleUserSelect = (user) => {
    // Reset the unread count for the selected user
    if (unreadCounts[user.id] > 0) {
      setUnreadCounts((prev) => ({ ...prev, [user.id]: 0 }));
    }
    onUserSelect(user);
  };

  return (
    <div className="h-screen w-full border-r border-gray-300 flex flex-col bg-[#454545] rounded-2xl">
      {/* Search Input */}
      <div className="p-2">
        <div className="flex items-center bg-gray-800 rounded-full px-3 py-2 w-full">
          <div className="h-5 w-5 border-2 border-indigo-400 rounded-full flex-shrink-0 animate-pulse"></div>
          <input
            className="ml-3 bg-transparent outline-none text-gray-300 w-full"
            placeholder="Ask Meta AI or Search"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* User List with Scrollable Container */}
      <ul className="flex-1 overflow-y-auto">
        {filteredUsers.map((user) => (
          <li
            key={user.id}
            onClick={() => handleUserSelect(user)}
            className={`p-2 cursor-pointer ${
              selectedUser?.id === user.id ? "bg-blue-100" : "hover:bg-[#676364] rounded-lg"
            }`}
          >
            <div className="flex items-center">
              {/* Profile Photo */}
              <Image
                src={user.photoURL || Img1}
                alt={`${user.name || "Default"}'s profile`}
                width={45}
                height={45}
                className="w-[45px] h-[45px] rounded-full object-cover"
              />
              <div className="flex-1 ml-3 flex flex-col">
                {/* User Name and Unread Count */}
                <div className="flex justify-between items-center">
                  <span className="text-white font-medium flex items-center">
                    {user.name}
                    {unreadCounts[user.id] > 0 && (
                      <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
                        {unreadCounts[user.id]}
                      </span>
                    )}
                  </span>
                  <span className="text-xs text-gray-400">
                    {user.lastMessageTime
                      ? new Date(user.lastMessageTime).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : ""}
                  </span>
                </div>
                {/* Last Message */}
                <p className="text-sm text-gray-300 truncate mt-1">
                  {user.lastMessage || "No recent messages"}
                </p>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default UserList;
