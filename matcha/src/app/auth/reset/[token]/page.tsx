// matcha/src/app/auth/reset/[token]/page.tsx
"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";

type Errors = {
  password?: string[];
  general?: string;
};

export default function ResetPasswordPage() {
  const router = useRouter();
  const { token } = useParams();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setSuccessMsg(null);

    if (password !== confirm) {
      setErrors({ password: ["Passwords do not match"] });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/e-mail/password-confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.field && data.errors) {
          setErrors({ [data.field]: data.errors });
        } else if (data.error) {
          setErrors({ general: data.error });
        } else {
          setErrors({ general: "Unexpected error" });
        }
        return;
      }

      setSuccessMsg("Password successfully updated!");
      setTimeout(() => router.push("/auth"), 2000);
    } catch {
      setErrors({ general: "Network or server error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center h-full">
      <div className="w-full max-w-sm bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-md">
        <h1 className="text-xl font-semibold mb-4 text-center">New Password</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Password input */}
          <div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="New password"
              className="w-full border rounded-md px-3 py-2"
              required
            />
            {errors.password && (
              <p className="text-red-500 text-xs mt-1">{errors.password.join(", ")}</p>
            )}
          </div>

          {/* Confirm input */}
          <div>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Confirm new password"
              className="w-full border rounded-md px-3 py-2"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition ${
              loading ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            {loading ? "Updating..." : "Validate"}
          </button>
        </form>

        {/* Error or success messages */}
        {errors.general && (
          <p className="mt-4 text-sm text-center text-red-500">{errors.general}</p>
        )}
        {successMsg && (
          <p className="mt-4 text-sm text-center text-green-600">{successMsg}</p>
        )}
      </div>
    </div>
  );
}