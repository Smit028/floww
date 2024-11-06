// Functions for handling notifications
import { getToken, onMessage } from 'firebase/messaging';
import { messaging } from '../firebase/firebase';

export const requestNotificationPermission = async () => {
  try {
    const token = await getToken(messaging, { vapidKey: process.env.NEXT_PUBLIC_VAPID_KEY });
    if (token) {
      console.log('Notification permission granted. Token:', token);
    } else {
      console.log('No registration token available. Request permission to generate one.');
    }
  } catch (error) {
    console.error('Error getting permission for notifications:', error);
  }
};

export const onMessageListener = () =>
  new Promise((resolve) => {
    onMessage(messaging, (payload) => {
      console.log('Message received:', payload);
      resolve(payload);
    });
  });
