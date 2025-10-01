// components/profile/ProfileForm.tsx
"use client";

import { useState } from "react";

export default function ProfileForm({ user }: { user: any }) {

    console.log("user reçu dans ProfileForm:", user);
  const [formData, setFormData] = useState({
    username: user.username || "",
    email: user.email || "",
    city: user.city || "",
    gender: user.gender || "",
    sex_pref: user.sex_pref || "",
    bio: user.bio || "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });
    if (res.ok) {
      alert("Profil mis à jour ✅");
    } else {
      alert("Erreur lors de la mise à jour ❌");
    }
  };

  return (

    <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-96 mx-auto mt-10 bg-white p-8 rounded-2xl shadow-md">
      <div>
        <label className="block font-medium text-gray-900 ml-3">User name</label>
        <input
          name="username"
          value={formData.username}
          onChange={handleChange}
            className="px-4 py-2 rounded-full border border-gray-300 
                focus:outline-none focus:ring-2 focus:ring-pink-400
                text-gray-900"
        />
      </div>

      <div>
        <label className="block font-medium text-gray-900 ml-3">Email</label>
        <input
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
            className="px-4 py-2 rounded-full border border-gray-300 
                focus:outline-none focus:ring-2 focus:ring-pink-400
                text-gray-900"
        />
      </div>

      <div>
        <label className="block font-medium text-gray-900 ml-3">Town</label>
        <input
          name="city"
          value={formData.city}
          onChange={handleChange}
            className="px-4 py-2 rounded-full border border-gray-300 
                focus:outline-none focus:ring-2 focus:ring-pink-400
                text-gray-900"
        />
      </div>

      <div>
        <label className="block font-medium text-gray-900 ml-3">Genre</label>
        <select
          name="gender"
          value={formData.gender}
          onChange={handleChange}
            className="px-4 py-2 rounded-full border border-gray-300 
                focus:outline-none focus:ring-2 focus:ring-pink-400
                text-gray-900"
        >
          <option value="M">Homme</option>
          <option value="F">Femme</option>
          <option value="O">Autre</option>
        </select>
      </div>

      <div>
        <label className="block font-medium text-gray-900 ml-3">Sexual preference</label>
        <select
          name="sex_pref"
          value={formData.sex_pref}
          onChange={handleChange}
            className="px-4 py-2 rounded-full border border-gray-300 
                focus:outline-none focus:ring-2 focus:ring-pink-400
                text-gray-900"
        >
          <option value="M">Homme</option>
          <option value="F">Femme</option>
          <option value="B">Les deux</option>
        </select>
      </div>

      <div>
        <label className="block font-medium text-gray-900 ml-3">Bio</label>
        <textarea
          name="bio"
          value={formData.bio}
          onChange={handleChange}
          rows={4}
            className="px-4 py-2 rounded border border-gray-300 
                focus:outline-none focus:ring-2 focus:ring-pink-400
                text-gray-900"
        />
      </div>

      <button
        type="submit"
        className="px-4 py-2 rounded-full bg-pink-600 text-white font-semibold 
            hover:bg-pink-700 transition disabled:opacity-50"
      >
        Save
      </button>
    </form>
  );
}