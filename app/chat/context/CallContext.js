// context/CallContext.js
"use client"
import React, { createContext, useContext, useState, useRef } from 'react';
import Peer from 'simple-peer';

const CallContext = createContext();

export const CallProvider = ({ children }) => {
  const [isCalling, setIsCalling] = useState(false);
  const [peer, setPeer] = useState(null);
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);

  const startCall = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    localStreamRef.current = stream;
    const newPeer = new Peer({ initiator: true, trickle: false, stream });
    
    newPeer.on('stream', (stream) => {
      remoteStreamRef.current.srcObject = stream;
    });

    setPeer(newPeer);
    setIsCalling(true);
  };

  const answerCall = async (signal) => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    localStreamRef.current = stream;
    const newPeer = new Peer({ initiator: false, trickle: false, stream });
    
    newPeer.on('signal', (data) => {
      // Send signal data back to the caller
    });
    
    newPeer.on('stream', (stream) => {
      remoteStreamRef.current.srcObject = stream;
    });
    
    newPeer.signal(signal);
    setPeer(newPeer);
    setIsCalling(true);
  };

  return (
    <CallContext.Provider value={{ isCalling, startCall, answerCall, localStreamRef, remoteStreamRef }}>
      {children}
    </CallContext.Provider>
  );
};

export const useCall = () => useContext(CallContext);
