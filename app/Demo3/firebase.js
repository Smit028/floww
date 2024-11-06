// lib/firebase.js
import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

const firebaseConfig = {
    apiKey: "AIzaSyDdS2hba_4oJWk8zSwMtx7xz7wFBYt1_KQ",
    authDomain: "whatsapp-clone-30fe9.firebaseapp.com",
    projectId: "whatsapp-clone-30fe9",
    storageBucket: "whatsapp-clone-30fe9.appspot.com",
    messagingSenderId: "264597757126",
    appId: "1:264597757126:web:820d6a782c1fd40b354bc7",
    measurementId: "G-0V7LW83BZH"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

// Function to request permission and retrieve token
export const requestNotificationPermission = async () => {
  try {
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      const token = await getToken(messaging, { vapidKey: "YOUR_VAPID_KEY" });
      console.log("FCM token:", token);
      return token;
    }
    console.warn("Notification permission not granted.");
  } catch (error) {
    console.error("Error getting permission or token:", error);
  }
};

// Function to listen for foreground notifications
export const onMessageListener = () =>
  new Promise((resolve) => {
    onMessage(messaging, (payload) => {
      resolve(payload);
    });
  });
