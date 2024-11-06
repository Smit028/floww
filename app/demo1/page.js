"use client";
import Head from 'next/head';
import VoiceCall from './VoiceCall';
import { useSearchParams } from 'next/navigation';

export default function Home() {
  const searchParams = useSearchParams();

  const currentUserId = searchParams.get("currentUserId");
  const currentUserName = searchParams.get("currentUserName");
  const currentUserPhotoURL = searchParams.get("currentUserPhotoURL");

  const chatUserId = searchParams.get("chatUserId");
  const chatUserName = searchParams.get("chatUserName");
  const chatUserPhotoURL = searchParams.get("chatUserPhotoURL");

  return (
    <div>
      <Head>
        <title>Voice Call Demo</title>
      </Head>
      <VoiceCall currentUserId={currentUserId} chatUserId={chatUserId} />
      <div>
        <h1>Current User Details</h1>
        <p>ID: {currentUserId || 'N/A'}</p>
        <p>Name: {currentUserName || 'N/A'}</p>
        {currentUserPhotoURL ? (
          <img src={currentUserPhotoURL} alt={`${currentUserName}'s profile`} />
        ) : (
          <p>No profile picture available</p>
        )}

        <h1>Chat User Details</h1>
        <p>ID: {chatUserId || 'N/A'}</p>
        <p>Name: {chatUserName || 'N/A'}</p>
        {chatUserPhotoURL ? (
          <img src={chatUserPhotoURL} alt={`${chatUserName}'s profile`} />
        ) : (
          <p>No profile picture available</p>
        )}
      </div>
    </div>
  );
}
