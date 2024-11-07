// pages/_app.js or a separate login component
"use client";
import { useEffect } from "react";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import setupUser from "./utils/setupUser";
import "./globals.css"
import Ripple from "@/components/ui/ripple";

const Home = () => {
  const auth = getAuth();

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const { user } = await signInWithPopup(auth, provider);
      await setupUser(user);
      window.location.href = "/chat"; // Adjust this as needed for your routing
    } catch (error) {
      console.error("Error during login:", error);
    }
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        await setupUser(user); // Ensure user document is set up
        window.location.href = "/chat"; // Adjust this as needed for your routing
      }
    });

    return () => unsubscribe();
  }, [auth]);

  return (
<div className="flex flex-col items-center justify-center min-h-screen bg-[#f5f5f5] text-[#1E1E1E] font-sans p-4 sm:p-8">
  <h1 className="text-3xl sm:text-4xl lg:text-5xl font-semibold mb-6 sm:mb-8 text-[#1E1E1E] text-center">
    Chat Application
  </h1>
  <button 
    onClick={handleLogin} 
    className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 text-base sm:text-lg font-medium text-white bg-[#1E1E1E] rounded-lg shadow hover:bg-[#333333] transition-colors duration-200"
  >
    Login with Google
  </button>

  {/* <div className="flex flex-col items-start space-y-4 w-full max-w-md mt-8 bg-white p-4 rounded-lg shadow-md">
    <div className="p-2 rounded-lg max-w-xs bg-[#D8FF75] text-[#1E1E1E] self-start">
      <span>Received message with the soft greenish-yellow background</span>
    </div>
    <div className="p-2 rounded-lg max-w-xs bg-[#1E1E1E] text-white self-end">
      <span>Sent message with the dark background</span>
    </div>
  </div> */}

  <Ripple />
</div>


  );
};

export default Home;
