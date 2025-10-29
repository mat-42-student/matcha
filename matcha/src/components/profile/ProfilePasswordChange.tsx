"use client";
import { useState } from "react";
import toast from "react-hot-toast";



export default function ProfilePasswordChange() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
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

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Password change failed");
      }

      toast.success("Password changed successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      toast.error(err.message || "Failed to change password");
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
        </div>

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
        </div>

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
          className={`w-full bg-pink-500 hover:bg-pink-600 text-white font-medium py-2 px-4 rounded-full transition ${loading ? "opacity-50 cursor-not-allowed" : ""
            }`}
        >
          {loading ? "Saving..." : "Update Password"}
        </button>
      </form>
    </div>
  );
}
