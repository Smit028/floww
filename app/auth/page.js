"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { loginWithGoogle } from '../auth/auth'; 
import { onAuthStateChanged } from "firebase/auth";
import { auth } from '../chat/firebase'; 
import "../globals.css";

const Auth = () => {
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // Redirect to the chat page if the user is logged in
        router.push("/chat");
      }
    });

    return () => unsubscribe();
  }, [router]);

  return (
    <div className="flex items-center justify-center h-screen w-screen bg-gray-100 overflow-hidden">
      <div className="flex flex-col items-center">
        <h1 className="text-3xl mb-4">Chat Application</h1>
        <button
          className="bg-blue-500 text-white py-2 px-6 rounded transition duration-200 hover:bg-blue-600"
          onClick={loginWithGoogle}
        >
          Sign in with Google
        </button>
      </div>
    </div>
  );
};

export default Auth;
