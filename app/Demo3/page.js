// pages/_app.js
"use client"
import { useEffect } from "react";
import { requestNotificationPermission, onMessageListener } from "../Demo3/firebase";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function Home({ Component, pageProps }) {
  useEffect(() => {
    // Request notification permission
    requestNotificationPermission();

    // Register the service worker for background messages
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/firebase-messaging-sw.js")
        .then((registration) => {
          console.log("Service Worker registered with scope:", registration.scope);
        })
        .catch((error) => console.error("Service Worker registration failed:", error));
    }

    // Listen for foreground messages
    onMessageListener()
      .then((payload) => {
        console.log("Foreground notification:", payload);
        toast.info(`Notification: ${payload.notification.title}`);
      })
      .catch((err) => console.log("Failed to receive foreground notification:", err));
  }, []);

  return (
    <>
      <Component {...pageProps} />
      <ToastContainer />
    </>
  );
}

export default Home;
