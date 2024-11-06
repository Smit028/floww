import React from 'react';
import { useCall } from './context/CallContext';

const CallComponent = () => {
  const { isCalling, localStreamRef, remoteStreamRef, startCall, answerCall } = useCall();

  return (
    <div>
      <button onClick={startCall}>Start Call</button>
      {isCalling && (
        <>
          <audio ref={localStreamRef} autoPlay muted />
          <audio ref={remoteStreamRef} autoPlay />
        </>
      )}
    </div>
  );
};

export default CallComponent;
