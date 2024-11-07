import React, { useState, useRef } from 'react';
import { storage } from '../chat/firebase'; // Adjust the path based on your project structure
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { auth } from '../chat/firebase'; // Adjust the path based on your project structure

const ImageMessageInput = ({ selectedUser }) => {
    const [newMessage, setNewMessage] = useState("");
    const [imageFile, setImageFile] = useState(null);
    const inputRef = useRef(null);

    const sendMessage = async () => {
        if (newMessage.trim() && selectedUser) {
            const userChatId = [auth.currentUser.uid, selectedUser.id].sort().join("_");
            const messagesCollection = collection(firestore, `chat/${userChatId}/messages`);

            // Send the text message
            await addDoc(messagesCollection, {
                text: newMessage,
                uid: auth.currentUser.uid,
                timestamp: serverTimestamp(),
                delivered: true,
                seen: false,
            });
            setNewMessage(""); // Clear the message input
        }
    };

    const sendImage = async () => {
        if (imageFile && selectedUser) {
            const userChatId = [auth.currentUser.uid, selectedUser.id].sort().join("_");
            const messagesCollection = collection(firestore, `chat/${userChatId}/messages`);

            // Create a storage reference
            const storageRef = ref(storage, `chat_images/${Date.now()}_${imageFile.name}`);

            try {
                // Upload the file
                await uploadBytes(storageRef, imageFile);

                // Get the download URL
                const imageUrl = await getDownloadURL(storageRef);

                // Send the message with the image URL
                await addDoc(messagesCollection, {
                    imageUrl, // Store the image URL
                    uid: auth.currentUser.uid,
                    timestamp: serverTimestamp(),
                    delivered: true,
                    seen: false,
                });

                // Clear the image input only after successful upload
                setImageFile(null);
            } catch (error) {
                console.error("Error uploading image: ", error); // Log any errors
            }
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) { // Allow Shift+Enter for new line
            e.preventDefault();
            handleSend();
        }
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImageFile(file); // Set the selected image file
        }
    };

    const handleSend = async () => {
        if (newMessage.trim() || imageFile) { // Check if there's a message or an image to send
            await Promise.all([sendMessage(), sendImage()]); // Send text and image together
            inputRef.current.focus(); // Focus back on the input
        }
    };

    return (
        <div className="p-2 border-t border-gray-300 bg-gray-50 flex items-center">
            <textarea
                ref={inputRef}
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your message..."
                className="flex-1 p-2 resize-none bg-gray-200 rounded-lg focus:outline-none focus:ring"
            />
            <input 
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="ml-2"
            />
            <button
                onClick={handleSend}
                className="ml-2 px-4 py-2 text-white bg-blue-500 rounded-lg"
            >
                Send
            </button>
        </div>
    );
};

export default ImageMessageInput;
