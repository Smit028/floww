// pages/api/sendNotification.js
import admin from 'firebase-admin';

// Initialize Firebase Admin
if (!admin.apps.length) {
    const serviceAccount = require('../../path/to/your/serviceAccountKey.json');

    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

export default async function handler(req, res) {
    const { token, title, body } = req.body;

    const message = {
        notification: {
            title: title,
            body: body,
        },
        token: token,
    };

    try {
        const response = await admin.messaging().send(message);
        return res.status(200).json({ success: true, response });
    } catch (error) {
        console.error('Error sending message:', error);
        return res.status(500).json({ success: false, error });
    }
}
