// components/NotificationDemo.js
"use client";

import { useEffect } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Create a single BroadcastChannel instance outside the component
const broadcast = new BroadcastChannel("notifications");

function NotificationDemo() {
  const notify = () => {
    // Send a message to the broadcast channel
    broadcast.postMessage("New notification from another tab!");

    // Show a notification in the current tab
    toast.success("Notification sent to other tabs!", {
      position: "top-right",
      autoClose: 3000,
    });
  };

  useEffect(() => {
    // Listen for messages from the broadcast channel
    broadcast.onmessage = (event) => {
      // Show notification when a message is received
      toast.info(event.data, {
        position: "top-right",
        autoClose: 3000,
      });
    };

    // Clean up only the message listener on unmount
    return () => {
      broadcast.onmessage = null; // Remove the event listener
    };
  }, []);

  return (
    <div>
      <button onClick={notify} className="bg-blue-500 text-white px-4 py-2 rounded">
        Send Notification to Other Tabs
      </button>
      <ToastContainer />
    </div>
  );
}

export default NotificationDemo;
