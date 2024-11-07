// auth/auth.js
import { auth, firestore } from '../chat/firebase';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import setupUser from '../utils/setupUser';

const provider = new GoogleAuthProvider();

export const loginWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    // Call setupUser to add user data to Firestore
    await setupUser(user);
  } catch (error) {
    console.error('Error during Google login:', error);
  }
};
