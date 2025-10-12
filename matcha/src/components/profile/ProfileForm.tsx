"use client";
import { useState, useEffect, useMemo } from "react";
import { Edit2 } from "lucide-react";
import toast from "react-hot-toast";

export default function ProfileForm({
  user,
  onUserUpdate,
}: {
  user: any;
  onUserUpdate?: (updates: Partial<any>) => void;
}) {
  const initialData = useMemo(
    () => ({
      username: user.username || "",
      email: user.email || "",
      sex_pref: user.sex_pref || "",
      bio: user.bio || "",
      gender: user.gender || "",
    }),
    [user]
  );

  const [formData, setFormData] = useState(initialData);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // 🔄 Met à jour formData si le user change (ex: rechargement après sauvegarde)
  useEffect(() => {
    setFormData(initialData);
    setHasUnsavedChanges(false);
  }, [initialData]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const updated = { ...prev, [name]: value };

      // Vérifie s’il y a une différence avec les données initiales
      const modified =
        Object.keys(initialData).some((key) => updated[key as keyof typeof updated] !== initialData[key as keyof typeof initialData]);

      setHasUnsavedChanges(modified);
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error("Erreur de mise à jour");

      onUserUpdate?.(formData);
      toast.success("Profil mis à jour ✅");

      // Réinitialise les états
      setEditingField(null);
      setHasUnsavedChanges(false);
    } catch (err) {
      console.error(err);
      toast.error("Erreur pendant la mise à jour");
    }
  };

  const renderRow = (
    label: string,
    name: string,
    type: "text" | "textarea" | "select" = "text"
  ) => {
    const isEditing = editingField === name;
    return (
      <div className="flex items-center justify-between py-4 border-b text-gray-900">
        <div className="flex-1 flex items-center">
          <span className="font-medium">{label}:</span>
          {isEditing ? (
            type === "textarea" ? (
              <textarea
                name={name}
                value={(formData as any)[name]}
                onChange={handleChange}
                className="ml-2 w-full rounded border px-4 py-2 text-gray-900 border-pink-300 ring-2 ring-pink-300"
              />
            ) : type === "select" ? (
              <select
                name={name}
                value={(formData as any)[name]}
                onChange={handleChange}
                className="ml-2 max-w-sm rounded-full border border-pink-400 px-4 py-2 ring-2 ring-pink-400"
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
                className="ml-2 max-w-sm rounded-full border border-pink-400 px-4 py-2 ring-2 ring-pink-400"
              />
            )
          ) : (
            <span className="ml-2 text-gray-700">
              {name === "sex_pref"
                ? formData.sex_pref === "M"
                  ? "Homme"
                  : formData.sex_pref === "F"
                  ? "Femme"
                  : "Les deux"
                : (formData as any)[name] || "-"}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={() => {
            if (hasUnsavedChanges && editingField && editingField !== name) {
              toast.error("Save before leave");
              return;
            }

            setEditingField(isEditing ? null : name);
          }}
          className="ml-4 h-10 w-10 flex items-center justify-center bg-pink-100 hover:bg-pink-200 rounded-full"
        >
          <Edit2 className="text-pink-600" size={20} />
        </button>
      </div>
    );
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      {renderRow("Username", "username")}
      {renderRow("Email", "email")}
      {renderRow("Sexual preference", "sex_pref", "select")}
      {renderRow("Bio", "bio", "textarea")}

      {hasUnsavedChanges && (
        <button
          type="submit"
          className="mt-6 px-4 py-2 rounded-full bg-pink-600 text-white font-semibold"
        >
          Sauvegarder
        </button>
      )}
    </form>
  );
}