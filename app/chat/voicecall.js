"use client"; // Required for client-side components

import { useEffect, useRef, useState } from "react";
import Peer from "peerjs";
import io from "socket.io-client";
import "../globals.css";

const socket = io();

const VoiceCall = () => {
    const localAudioRef = useRef(null);
    const remoteAudioRef = useRef(null);
    const [myId, setMyId] = useState("");
    const [peer, setPeer] = useState(null);
    const [audioDevices, setAudioDevices] = useState([]);
    const [selectedDevice, setSelectedDevice] = useState("");
    const [incomingCall, setIncomingCall] = useState(null);
    const [currentCall, setCurrentCall] = useState(null);
    const [callerId, setCallerId] = useState("");
    const [userList, setUserList] = useState([]);

    useEffect(() => {
        const initializePeerAndSocket = () => {
            const newPeer = new Peer({
                config: {
                    iceServers: [
                        { urls: "stun:stun.l.google.com:19302" },
                    ],
                },
            });

            setPeer(newPeer);

            newPeer.on("open", (id) => {
                setMyId(id); // Set the Peer ID
                socket.emit("register", id); // Register with the server
            });

            newPeer.on("call", (call) => {
                setIncomingCall(call);
                setCallerId(call.peer); // Store the caller ID for callback
            });

            // Handle incoming signal messages from the server
            socket.on("signal", (data) => {
                newPeer.signal(data.signal);
            });

            // Handle user list updates
            socket.on("user_list", (users) => {
                setUserList(users); // Update the user list
            });

            // Handle responses to the call
            socket.on("call_response", (data) => {
                if (data.accepted && incomingCall) {
                    handleCallAccepted();
                } else {
                    setIncomingCall(null); // Clear incoming call state if declined
                }
            });

            return () => {
                socket.disconnect();
                newPeer.destroy();
            };
        };

        const getAudioDevices = async () => {
            if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
                const devices = await navigator.mediaDevices.enumerateDevices();
                const audioInputDevices = devices.filter(
                    (device) => device.kind === "audioinput"
                );
                setAudioDevices(audioInputDevices);
                if (audioInputDevices.length > 0) {
                    setSelectedDevice(audioInputDevices[0].deviceId);
                }
            } else {
                console.error("Media devices API not supported in this browser.");
            }
        };

        initializePeerAndSocket();
        getAudioDevices();
    }, []);

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

    const startCall = async (remotePeerId) => {
        const stream = await getAudioStream();
        if (stream && peer) {
            const call = peer.call(remotePeerId, stream);
            setCurrentCall(call);
            call.on("stream", (remoteStream) => {
                remoteAudioRef.current.srcObject = remoteStream; // Set remote stream
            });
            socket.emit("call_invitation", { to: remotePeerId });
        } else {
            console.error("Error starting call. Stream or peer instance not available.");
        }
    };

    const handleCallAccepted = async () => {
        const stream = await getAudioStream();
        incomingCall.answer(stream); // Answer the call
        setCurrentCall(incomingCall); // Set the current call state
        incomingCall.on("stream", (remoteStream) => {
            remoteAudioRef.current.srcObject = remoteStream; // Set remote stream
        });
        localAudioRef.current.srcObject = stream; // Set local stream
        setIncomingCall(null); // Clear incoming call state
    };

    const cutCall = () => {
        if (currentCall) {
            const peerId = currentCall.peer; // Get the peer ID of the current call
            currentCall.close(); // Close the current call
            socket.emit("call_closed", { peer: peerId }); // Notify the other peer that the call is ended
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
            setIncomingCall(null); // Clear incoming call state
        }
    };

    const handleCallEnded = (peerId) => {
        if (peerId === currentCall?.peer) {
            cleanupCurrentCall(); // Clean up the call state if it was the current call
        }
    };

    return (
        <div className="flex flex-col items-center p-5 bg-gray-100 min-h-screen">
            <h1 className="text-2xl font-bold mb-5">Voice Call Demo</h1>
            <p className="mb-4">Your Peer ID: <strong>{myId}</strong></p>

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

            <label htmlFor="user-select" className="mb-2 text-lg">Select User to Call:</label>
            <select
                id="user-select"
                onChange={(e) => startCall(e.target.value)}
                className="mb-4 p-2 border rounded-md shadow-md"
            >
                <option value="">Select User</option>
                {userList.map((user) => (
                    <option key={user} value={user}>
                        {user}
                    </option>
                ))}
            </select>

            {incomingCall && (
                <div className="mb-4 p-4 border rounded-md shadow-md bg-white">
                    <p>Incoming call from {callerId}!</p>
                    <button onClick={pickupCall} className="mr-2 bg-green-500 text-white p-2 rounded">Accept</button>
                    <button onClick={declineCall} className="bg-red-500 text-white p-2 rounded">Decline</button>
                </div>
            )}

            {currentCall ? (
                <button onClick={cutCall} className="bg-red-500 text-white p-4 rounded">End Call</button>
            ) : (
                <p className="text-gray-500">No active calls</p>
            )}
        </div>
    );
};

export default VoiceCall;
