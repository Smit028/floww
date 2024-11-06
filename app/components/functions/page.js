const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

exports.sendNotificationOnNewMessage = functions.firestore
  .document("chat/{chatId}/messages/{messageId}")
  .onCreate(async (snapshot, context) => {
    const messageData = snapshot.data();
    const { uid, text } = messageData;
    const chatId = context.params.chatId;
    const receiverId = chatId.split("_").find(id => id !== uid);

    // Get the recipient's fcmToken
    const userDoc = await admin.firestore().doc(`users/${receiverId}`).get();
    const fcmToken = userDoc.data().fcmToken;

    if (fcmToken) {
      const message = {
        notification: {
          title: "New Message",
          body: text,
        },
        token: fcmToken,
      };

      try {
        await admin.messaging().send(message);
        console.log("Notification sent successfully");
      } catch (error) {
        console.error("Error sending notification:", error);
      }
    }
  });
