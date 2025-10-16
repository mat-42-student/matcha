"use client";
import { useState, useEffect, useMemo } from "react";
import { Edit2, Check } from "lucide-react";
import toast from "react-hot-toast";
import { validateProfileField } from "@/lib/validators/clientValidator";

export default function ProfileForm({
  user,
  onUserUpdate,
}: {
  user: any;
  onUserUpdate?: (updates: Partial<any>) => void;
}) {
  const initialData = useMemo(
    () => ({
      first_name: user.first_name || "",
      last_name: user.last_name || "",
      email: user.email || "",
      gender: user.gender || "",
      sex_pref: user.sex_pref || "",
      bio: user.bio || "",
    }),
    [user]
  );

  const [formData, setFormData] = useState(initialData);
  const [editingField, setEditingField] = useState<string | null>(null);

  // 🔄 update local form if user prop changes
  useEffect(() => {
    setFormData(initialData);
  }, [initialData]);

const saveField = async (field: string) => {
  const value = (formData as any)[field];

  const { valid, error } = validateProfileField(field, value);
  if (!valid) {
    toast.error(error || "Invalid value");
    setEditingField(field);
    return false;
  }

  try {
    const res = await fetch("/api/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: value }),
    });

    if (!res.ok) throw new Error("Update error");

    onUserUpdate?.({ [field]: value });
    toast.success(`${field.replace("_", " ")} updated successfully`);
    return true; // success
  } catch (err) {
    console.error(err);
    toast.error(`Failed to update ${field}`);
    setEditingField(field); // keep editing mode
    return false;
  }
};

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
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
                className="ml-2 max-w-sm rounded-full border border-pink-400 px-4 py-2 ring-2 ring-pink-400 text-gray-900"
              >
                <option value="" disabled hidden>
                  Select...
                </option>
                {name === "gender" ? (
                  <>
                    <option value="M">Man</option>
                    <option value="F">Woman</option>
                  </>
                ) : (
                  <>
                    <option value="M">Men</option>
                    <option value="F">Women</option>
                    <option value="B">Both</option>
                  </>
                )}
              </select>
            ) : (
              <input
                name={name}
                type={type}
                value={(formData as any)[name]}
                onChange={handleChange}
                className="ml-2 max-w-sm rounded-full border border-pink-400 px-4 py-2 ring-2 ring-pink-400 text-gray-900"
              />
            )
          ) : (
            <span className="ml-2 text-gray-700">
              {name === "gender"
                ? formData.gender === "M"
                  ? "Man"
                  : formData.gender === "F"
                  ? "Woman"
                  : "-"
                : name === "sex_pref"
                ? formData.sex_pref === "M"
                  ? "Men"
                  : formData.sex_pref === "F"
                  ? "Women"
                  : formData.sex_pref === "B"
                  ? "Both"
                  : "-"
                : (formData as any)[name] || "-"}
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={async () => {
            if (!isEditing && editingField && editingField !== name) {
              toast.error("Finish editing the current field first.");
              return;
            }

            if (isEditing) {
              const success = await saveField(name);
              if (success) setEditingField(null); // only exit editing mode if valid
            } else {
              setEditingField(name);
            }
          }}
          className={`ml-4 h-10 w-10 flex items-center justify-center rounded-full transition 
            ${isEditing ? "bg-green-100 hover:bg-green-200" : "bg-pink-100 hover:bg-pink-200"}`}
        >
          {isEditing ? (
            <Check className="text-green-600" size={20} />
          ) : (
            <Edit2 className="text-pink-600" size={20} />
          )}
        </button>
      </div>
    );
  };

  return (
    <div className="w-full">
      {renderRow("First Name", "first_name")}
      {renderRow("Last Name", "last_name")}
      {renderRow("Email", "email")}
      {renderRow("Gender", "gender", "select")}
      {renderRow("Sexual Preference", "sex_pref", "select")}
      {renderRow("Bio", "bio", "textarea")}
    </div>
  );
}