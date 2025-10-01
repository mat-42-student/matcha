"use client";
import { Edit2 } from "lucide-react";
import { useState } from "react";

export default function ProfileForm({ user }: { user: any }) {
  const [formData, setFormData] = useState({
    username: user.username || "",
    email: user.email || "",
    city: user.city || "",
    gender: user.gender || "",
    sex_pref: user.sex_pref || "",
    bio: user.bio || "",
  });

  const [editingField, setEditingField] = useState<string | null>(null);

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
      setEditingField(null);
    } else {
      alert("Erreur lors de la mise à jour ❌");
    }
  };

const renderRow = (label: string, name: string, type: "text" | "email" | "textarea" | "select" = "text") => {
  const isEditing = editingField === name;
  return (
    <div className="flex items-center justify-between py-4 border-b text-gray-900">
      <div className="flex-1 min-h-[2.5rem] flex items-center">
        <span className="font-medium text-gray-900">{label}: </span>
        {isEditing ? (
          type === "textarea" ? (
            <textarea
              name={name}
              value={(formData as any)[name]}
              onChange={handleChange}
              className={`ml-2 w-full rounded border px-4 py-2 text-gray-900
                  border-pink-300 ring-2 ring-pink-300 ring-offset-0 focus:outline-none`}
            />
          ) : type === "select" ? (
            <select
              name={name}
              value={(formData as any)[name]}
              onChange={handleChange}
              className="ml-2 max-w-sm rounded-full border border-pink-400 px-4 py-2 ring-2 ring-pink-400 focus:outline-none"
            >
              <option value="M">Homme</option>
              <option value="F">Femme</option>
              <option value="B">Les deux</option>
            </select>
          ) : (
            <input
              name={name}
              type={type}
              value={(formData as any)[name]}
              onChange={handleChange}
              className="ml-2 max-w-sm rounded-full border border-pink-400 px-4 py-2 ring-2 ring-pink-400 focus:outline-none"
            />
          )
        ) : (
          <span className="ml-2 text-gray-700">
            {name === "sex_pref"
              ? (formData.sex_pref === "M" ? "Homme" : formData.sex_pref === "F" ? "Femme" : "Les deux")
              : (formData as any)[name] || "-"}
          </span>
        )}
      </div>
      <button
        type="button"
        onClick={() => setEditingField(isEditing ? null : name)}
        className="ml-4 h-10 w-10 flex items-center justify-center bg-pink-100 hover:bg-pink-200 rounded-full"
      >
        <Edit2 className="text-pink-600" size={20} />
      </button>
    </div>
  );
};

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-lg mx-auto mt-10 bg-white p-8 rounded-2xl shadow-md">
    {renderRow("Nom d’utilisateur", "username")}
    {renderRow("Email", "email", "email")}
    {renderRow("Ville", "city")}
    {renderRow("Préférence sexuelle", "sex_pref", "select")}
    {renderRow("Bio", "bio", "textarea")}

      <div className="mt-6 flex justify-start">
        {editingField && (
          <button
            type="submit"
            className="px-4 py-2 rounded-full bg-pink-600 text-white font-semibold 
              hover:bg-pink-700 transition disabled:opacity-50"
          >
            Sauvegarder
          </button>
        )}
      </div>
    </form>
  );
}