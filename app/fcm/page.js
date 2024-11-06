"use client"
import React, { useState } from "react";
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
import Image from "next/image";
import profilePic from "../chat/alter.jpeg"; // Replace with your image path

const ProfileSettings = () => {
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

  return (
    <div className="h-screen bg-gray-900 text-white flex relative">
      {/* Collapsible Sidebar */}
     
      <div
        className={`fixed bottom-0 left-20 bg-gray-800 w-[500px] p-4 flex  transition-transform duration-500  ease-in-out ${
          isSidebarVisible ? "transform translate-y-0" : "transform translate-y-full"
        } w-64 rounded-t-lg shadow-lg`}
      >
         <div>
        {/* Sidebar Items */}
        <div className="space-y-4">
          {[
            { icon: <FaCog className="text-xl" />, label: "General", value: "general" },
            { icon: <FaKey className="text-xl" />, label: "Account", value: "account" },
            { icon: <FaUser className="text-xl" />, label: "Chats", value: "chats" },
            { icon: <FaVideo className="text-xl" />, label: "Video & voice", value: "video" },
            { icon: <FaBell className="text-xl" />, label: "Notifications", value: "notifications" },
            { icon: <FaPalette className="text-xl" />, label: "Personalization", value: "personalization" },
            { icon: <FaDatabase className="text-xl" />, label: "Storage", value: "storage" },
            { icon: <FaKeyboard className="text-xl" />, label: "Shortcuts", value: "shortcuts" },
            { icon: <FaInfoCircle className="text-xl" />, label: "Help", value: "help" },
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
              <h3 className="text-xl font-semibold">{selectedOption.charAt(0).toUpperCase() + selectedOption.slice(1)} Settings</h3>
              <p className="mt-2">{contentMap[selectedOption]}</p>
            </div>
          )}
      </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6 ml-64"> {/* Added margin-left to avoid overlap with sidebar */}
        {/* Toggle Button */}
        <div className="fixed bottom-4 left-4 cursor-pointer" onClick={toggleSidebar}>
          <Image
            src={profilePic}
            alt="Profile Picture"
            width={60}
            height={60}
            className="rounded-full"
          />
        </div>
        {/* Log Out Button */}
        <div className="mt-6">
          <button className="w-full bg-red-600 text-white py-2 rounded-md">
            Log out
          </button>
          <p className="text-sm text-gray-400 mt-2">
            Chat history on this computer will be cleared when you log out.
          </p>
        </div>

       
      </div>
    </div>
  );
};

export default ProfileSettings;
