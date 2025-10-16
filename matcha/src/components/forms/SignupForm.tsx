"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function SignupForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

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
      router.push("/auth");
    }
  } catch (err) {
    console.error(err);
    setErrors({ general: "Network error" });
  } finally {
    setLoading(false);
  }
}

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white p-8 rounded-2xl shadow-md flex flex-col gap-4 w-96"
    >
      <h1 className="text-2xl font-bold text-center text-pink-700">
        Create an account
      </h1>

      {errors.general && (
        <p className="text-red-600 text-sm text-center">{errors.general}</p>
      )}

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
        className="px-4 py-2 rounded-full bg-pink-600 text-white font-semibold hover:bg-pink-700 disabled:opacity-50"
      >
        {loading ? "Signing up..." : "Sign up"}
      </button>
    </form>
  );
}