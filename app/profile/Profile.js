"use client";
import { useEffect, useState } from "react";
import { firestore, auth } from "../chat/firebase";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

const Profile = () => {
  const [userDetails, setUserDetails] = useState({ name: "", photoURL: "", bio: "", phone: "" });
  const [imageFile, setImageFile] = useState(null);
  const storage = getStorage();

  useEffect(() => {
    const fetchUserDetails = async () => {
      const userDoc = await getDoc(doc(firestore, "users", auth.currentUser.uid));
      if (userDoc.exists()) {
        setUserDetails(userDoc.data());
      }
    };

    fetchUserDetails();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUserDetails((prevDetails) => ({ ...prevDetails, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { name, bio, phone } = userDetails;

    try {
      if (imageFile) {
        const storageRef = ref(storage, `profile_images/${auth.currentUser.uid}`);
        await uploadBytes(storageRef, imageFile);
        const imageUrl = await getDownloadURL(storageRef);
        await updateDoc(doc(firestore, "users", auth.currentUser.uid), {
          photoURL: imageUrl,
          name,
          bio,
          phone,
        });
      } else {
        await updateDoc(doc(firestore, "users", auth.currentUser.uid), {
          name,
          bio,
          phone,
        });
      }
      alert("Profile updated successfully!");
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Failed to update profile.");
    }
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow-md max-w-md mx-auto">
      <h2 className="text-2xl font-semibold mb-4">Profile</h2>
      <form onSubmit={handleSubmit}>
        {/* Row 1: Name */}
        <div className="mb-4">
          <label className="block text-gray-700">Name</label>
          <input
            type="text"
            name="name"
            value={userDetails.name}
            onChange={handleInputChange}
            className="w-full p-2 border border-gray-300 rounded"
            required
          />
        </div>

        {/* Row 2: Profile Picture */}
        <div className="mb-4">
          <label className="block text-gray-700">Profile Picture</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="border border-gray-300 rounded"
          />
        </div>

        {/* Row 3: Additional Details (Bio and Phone) */}
        <div className="mb-4">
          <label className="block text-gray-700">Bio</label>
          <textarea
            name="bio"
            value={userDetails.bio}
            onChange={handleInputChange}
            className="w-full p-2 border border-gray-300 rounded"
            rows="3"
            placeholder="Tell us about yourself..."
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700">Phone Number</label>
          <input
            type="text"
            name="phone"
            value={userDetails.phone}
            onChange={handleInputChange}
            className="w-full p-2 border border-gray-300 rounded"
            placeholder="Your phone number..."
          />
        </div>

        <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
          Save
        </button>
      </form>
      {userDetails.photoURL && (
        <div className="mt-4">
          <img src={userDetails.photoURL} alt="Profile" className="w-24 h-24 rounded-full" />
        </div>
      )}
    </div>
  );
};

export default Profile;
