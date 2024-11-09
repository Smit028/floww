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
      <h1 className="text-3xl sm:text-4xl lg:text-5xl font-semibold mb-4 sm:mb-6 text-[#1E1E1E] text-center">
        Flowww
      </h1>
      <p className="text-lg sm:text-xl text-center mb-6 sm:mb-8 text-[#2f2f2f]">
        Go with the Flowww, connect effortlessly!
      </p>
      <button 
        onClick={handleLogin} 
        className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 text-base sm:text-lg font-medium text-white bg-[#1E1E1E] rounded-lg shadow hover:bg-[#333333] transition-colors duration-200"
      >
        Login with Google
      </button>

      <Ripple />
    </div>
  );
};

export default Home;
