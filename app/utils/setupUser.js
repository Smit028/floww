// utils/setupUser.js
import { doc, setDoc, arrayUnion } from 'firebase/firestore';
import { firestore } from '../chat/firebase';

const setupUser = async (user) => {
  try {
    // Create user document in 'users' collection
    const userRef = doc(firestore, 'users', user.uid);
    await setDoc(userRef, {
      name: user.displayName,
      email: user.email,
      chats: [] // An array to store chat IDs the user is part of
    });

    console.log('User document created:', user.uid);
  } catch (error) {
    console.error('Error setting up user:', error);
  }
};

export default setupUser;
