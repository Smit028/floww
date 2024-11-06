"use client"; // Required for client-side components

import { useEffect, useRef, useState } from "react";
import Peer from "peerjs";
import io from "socket.io-client";
import "../globals.css";

// Define static IDs for the two users
const socket = io();

const VoiceCall = ({ currentUserId, chatUserId ,chatUserName,currentUserName }) => {
    const localAudioRef = useRef(null);
    const remoteAudioRef = useRef(null);
    const [peer, setPeer] = useState(null);
    const [audioDevices, setAudioDevices] = useState([]);
    const [selectedDevice, setSelectedDevice] = useState("");
    const [incomingCall, setIncomingCall] = useState(null);
    const [currentCall, setCurrentCall] = useState(null);

    const myStaticId = currentUserId; // Replace with the actual static ID of the current user
    const targetStaticId = chatUserId;

    // Set the current user's Peer ID when the component mounts
    useEffect(() => {
        const newPeer = new Peer(currentUserId, {
            config: {
                iceServers: [
                    { urls: "stun:stun.l.google.com:19302" },
                ],
            },
        });

        setPeer(newPeer);

        newPeer.on("open", (id) => {
            console.log(`Connected as ${id}`);
            socket.emit("register", { id: currentUserId }); // Notify the server about this user
        });

        newPeer.on("call", (call) => {
            setIncomingCall(call);
            console.log(`Incoming call from ${chatUserName}`); // Log incoming call peer ID
            alert(`Incoming call from ${chatUserName}`); // Alert for incoming call
        });

        // Cleanup function
        return () => {
            socket.disconnect();
            newPeer.destroy();
        };
    }, [currentUserId]);

    const getAudioStream = async () => {
        const constraints = {
            audio: {
                deviceId: selectedDevice ? { exact: selectedDevice } : undefined,
                echoCancellation: true,
                noiseSuppression: true,
                sampleRate: 44100,
                channelCount: 2,
                sampleSize: 16,
            },
        };

        try {
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            localAudioRef.current.srcObject = stream;
            return stream;
        } catch (error) {
            console.error("Error accessing audio device:", error);
            return null;
        }
    };

    const startCall = async () => {
        const stream = await getAudioStream();
        if (stream && peer) {
            const call = peer.call(chatUserId, stream); // Use chatUserId here
            if (call) {
                setCurrentCall(call);
                call.on("stream", (remoteStream) => {
                    remoteAudioRef.current.srcObject = remoteStream;
                });
                socket.emit("call_invitation", { to: chatUserId }); // Emit call invitation to the target user
            }
        }
    };

    const handleCallAccepted = async () => {
        const stream = await getAudioStream();
        incomingCall.answer(stream); // Answer the incoming call
        setCurrentCall(incomingCall);
        incomingCall.on("stream", (remoteStream) => {
            remoteAudioRef.current.srcObject = remoteStream; // Set remote stream
        });
        localAudioRef.current.srcObject = stream; // Set local stream
        alert(`Call accepted with ${chatUserName}`); // Alert for call accepted
        setIncomingCall(null); // Clear incoming call state
    };

    const cutCall = () => {
        if (currentCall) {
            const peerId = currentCall.peer; // Get the peer ID of the current call
            currentCall.close(); // Close the current call
            socket.emit("call_closed", { peer: peerId }); // Notify the other peer that the call is ended
            alert(`Call ended with ${chatUserName}`); // Alert for call ended
            cleanupCurrentCall(); // Clean up the current call state
        }
    };

    const cleanupCurrentCall = () => {
        setCurrentCall(null); // Clear current call state
        localAudioRef.current.srcObject = null; // Clear local audio
        remoteAudioRef.current.srcObject = null; // Clear remote audio
    };

    const pickupCall = () => {
        if (incomingCall) {
            handleCallAccepted();
        }
    };

    const declineCall = () => {
        if (incomingCall) {
            socket.emit("call_response", { to: incomingCall.peer, accepted: false });
            alert(`Call declined from ${incomingCall.peer}`); // Alert for call declined
            setIncomingCall(null); // Clear incoming call state
        }
    };

    const handleCallEnded = (peerId) => {
        if (peerId === currentCall?.peer) {
            cleanupCurrentCall(); // Clean up the call state if it was the current call
            alert(`Call ended with ${peerId}`); // Alert for call ended
        }
    };

    return (
        <div className="flex flex-col items-center p-5 bg-gray-100 min-h-screen">
            <h1 className="text-2xl font-bold mb-5">Voice Call Demo</h1>
            <p className="mb-4">Your Peer ID: <strong>{myStaticId}</strong></p>
            <audio ref={localAudioRef} autoPlay muted className="hidden" />
            <audio ref={remoteAudioRef} autoPlay className="hidden" />

            <label htmlFor="audio-select" className="mb-2 text-lg">Select Microphone:</label>
            <select
                id="audio-select"
                value={selectedDevice}
                onChange={(e) => setSelectedDevice(e.target.value)}
                className="mb-4 p-2 border rounded-md shadow-md"
            >
                {audioDevices.map((device) => (
                    <option key={device.deviceId} value={device.deviceId}>
                        {device.label || `Microphone ${device.deviceId}`}
                    </option>
                ))}
            </select>

            <button
                onClick={startCall}
                disabled={!!incomingCall || !!currentCall}
                className={`mb-4 p-2 rounded-md text-white ${
                    !!incomingCall || !!currentCall ? "bg-gray-400 cursor-not-allowed" : "bg-blue-500 hover:bg-blue-600"
                } transition duration-300`}
            >
                Start Call
            </button>

            {incomingCall && (
                <div className="mb-4 p-4 border rounded-md shadow-md bg-white">
                    <p className="text-lg font-semibold">Incoming Call...</p>
                    <div className="mt-2">
                        <button onClick={pickupCall} className="mr-2 p-2 bg-green-500 text-white rounded-md hover:bg-green-600">
                            Accept
                        </button>
                        <button onClick={declineCall} className="p-2 bg-red-500 text-white rounded-md hover:bg-red-600">
                            Decline
                        </button>
                    </div>
                </div>
            )}

            {currentCall && (
                <div className="mt-4 p-4 border rounded-md shadow-md bg-white">
                    <p className="text-lg font-semibold">Current Call with {currentCall.peer}</p>
                    <button onClick={cutCall} className="mt-2 p-2 bg-red-500 text-white rounded-md hover:bg-red-600">
                        End Call
                    </button>
                </div>
            )}
        </div>
    );
};

export default VoiceCall;
