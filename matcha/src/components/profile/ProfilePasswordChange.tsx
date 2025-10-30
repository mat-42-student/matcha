"use client";

import { useState } from "react";
import toast from "react-hot-toast";

type Errors = {
  current_password?: string[];
  new_password?: string[];
  general?: string;
};

export default function ProfilePasswordChange() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (newPassword !== confirmPassword) {
      setErrors({ new_password: ["Passwords do not match"] });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/me/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.field && data.errors) {
          setErrors({ [data.field]: data.errors });
        } else if (data.error) {
          setErrors({ general: data.error });
        }
        return;
      }

      toast.success("Password changed successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      toast.error("Failed to change password");
      setErrors({ general: "Failed to change password" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center h-full">
      <form
        onSubmit={handleSubmit}
        className="bg-white shadow-lg rounded-2xl p-8 w-full max-w-md"
      >
        <h2 className="text-2xl font-semibold text-center mb-6 text-gray-900">
          Change Password
        </h2>

        {errors.general && (
          <p className="text-red-600 text-sm text-center mb-4">{errors.general}</p>
        )}

        {/* Current Password */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Current Password
          </label>
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
            className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-pink-400 focus:border-pink-400"
          />
          {errors.current_password && (
            <p className="text-red-500 text-xs mt-1">
              {errors.current_password.join(", ")}
            </p>
          )}
        </div>

        {/* New Password */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            New Password
          </label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-pink-400 focus:border-pink-400"
          />
          {errors.new_password && (
            <p className="text-red-500 text-xs mt-1">
              {errors.new_password.join(", ")}
            </p>
          )}
        </div>

        {/* Confirm New Password */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Confirm New Password
          </label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-pink-400 focus:border-pink-400"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`w-full bg-pink-500 hover:bg-pink-600 text-white font-medium py-2 px-4 rounded-full transition ${
            loading ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          {loading ? "Saving..." : "Update Password"}
        </button>
      </form>
    </div>
  );
}