// matcha/src/components/forms/SignupForm.tsx
"use client";

import Link from "next/link";
import { useState } from "react";

export function SignupForm() {
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  // set once the account is created: the form is replaced by a "check your emails" message
  const [signedUp, setSignedUp] = useState<{ email: string; emailSent: boolean } | null>(null);

async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
  e.preventDefault();
  setErrors({});
  setLoading(true);

  const formData = new FormData(e.currentTarget);

  try {
    const res = await fetch("/api/signup", { method: "POST", body: formData });
    const data = await res.json();

    if (!res.ok) {
      if (data.errors) {
        setErrors(data.errors); // store field errors
      } else {
        setErrors({ general: data.error || "Unknown error" });
      }
    } else {
      setSignedUp({ email: String(formData.get("email") ?? ""), emailSent: data.emailSent !== false });
    }
  } catch (err) {
    console.error(err);
    setErrors({ general: "Network error" });
  } finally {
    setLoading(false);
  }
}

  if (signedUp) {
    return (
      <div className="bg-white p-8 rounded-2xl shadow-md flex flex-col gap-4 w-full max-w-sm text-center">
        <h1 className="text-2xl font-bold text-pink-700">Check your emails</h1>
        {signedUp.emailSent ? (
          <p className="text-gray-700">
            Your account has been created. We sent a verification link to{" "}
            <span className="font-semibold break-all">{signedUp.email}</span>: click it to activate your
            account, then log in.
          </p>
        ) : (
          <p className="text-gray-700">
            Your account has been created, but the verification email could not be sent. Log in with your
            username and password to receive a new link.
          </p>
        )}
        <p className="text-gray-500 text-sm">
          The link is valid for 24 hours. If it expires, logging in sends you a new one.
        </p>
        <Link
          href="/auth"
          className="px-4 py-2 rounded-full bg-pink-600 text-white font-semibold hover:bg-pink-700
                    focus:outline-none focus:ring-2 focus:ring-pink-400"
        >
          Go to login
        </Link>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white p-8 rounded-2xl shadow-md flex flex-col gap-4 w-full max-w-sm"
    >
      <h1 className="text-2xl font-bold text-center text-pink-700">
        Create an account
      </h1>

      {errors.general && (
        <p className="text-red-600 text-sm text-center">{errors.general}</p>
      )}

      {/* Username */}
      <div>
        <input
          name="username"
          type="text"
          placeholder="Username"
          autoComplete="username"
          required
          minLength={3}
          maxLength={20}
          pattern="[A-Za-z0-9_]+"
          title="3-20 letters, numbers or underscores"
          className="px-4 py-2 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-pink-400 text-gray-900 w-full"
        />
        {errors.username && (
          <p className="text-red-500 text-xs mt-1">{errors.username}</p>
        )}
      </div>

      {/* Email */}
      <div>
        <input
          name="email"
          type="email"
          placeholder="Email"
          required
          className="px-4 py-2 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-pink-400 text-gray-900 w-full"
        />
        {errors.email && (
          <p className="text-red-500 text-xs mt-1">{errors.email}</p>
        )}
      </div>

      {/* Password */}
      <div>
        <input
          name="password"
          type="password"
          placeholder="Password"
          required
          className="px-4 py-2 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-pink-400 text-gray-900 w-full"
        />
        {errors.password && (
          <p className="text-red-500 text-xs mt-1">{errors.password}</p>
        )}
      </div>

      {/* First name */}
      <div>
        <input
          name="first_name"
          type="text"
          placeholder="First name"
          required
          maxLength={50}
          className="px-4 py-2 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-pink-400 text-gray-900 w-full"
        />
        {errors.first_name && (
          <p className="text-red-500 text-xs mt-1">{errors.first_name}</p>
        )}
      </div>

      {/* Last name */}
      <div>
        <input
          name="last_name"
          type="text"
          placeholder="Last name"
          required
          maxLength={50}
          className="px-4 py-2 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-pink-400 text-gray-900 w-full"
        />
        {errors.last_name && (
          <p className="text-red-500 text-xs mt-1">{errors.last_name}</p>
        )}
      </div>

      {/* Birthdate */}
      <div>
        <input
          name="birthdate"
          type="date"
          required
          className="px-4 py-2 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-pink-400 text-gray-900 w-full"
        />
        {errors.birthdate && (
          <p className="text-red-500 text-xs mt-1">{errors.birthdate}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={loading}
        className="px-4 py-2 rounded-full bg-pink-600 text-white font-semibold hover:bg-pink-700 disabled:opacity-50
                  focus:outline-none focus:ring-2 focus:ring-pink-400"
      >
        {loading ? "Signing up..." : "Sign up"}
      </button>
    </form>
  );
}