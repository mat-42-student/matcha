"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

export default function VerifyError() {
  const searchParams = useSearchParams();
  const reason = searchParams.get("reason");

  let message = "An error occurred.";
  if (reason === "missing") message = "Invalid verification link (missing token).";
  if (reason === "invalid") message = "This verification link is invalid.";
  if (reason === "expired") message = "This link has expired. Request a new verification email.";
  if (reason === "taken") message = "This email address is already in use.";
  if (reason === "server") message = "Internal server error. Please try again later.";

  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-2xl shadow-md text-center max-w-md">
        <h1 className="text-2xl font-bold text-red-600">❌ Verification Failed</h1>
        <p className="mt-4 text-gray-700">{message}</p>
        <div className="mt-6 text-left text-sm text-gray-600 flex flex-col gap-2">
          <p className="font-semibold text-gray-700">How to get a new link</p>
          <p>
            New account: log in with your username and password. If your account is not verified yet and
            no valid link is pending, a new verification email is sent automatically.
          </p>
          <p>
            Email change: log in and request the change again from your profile.
          </p>
          <p>
            Already verified? The link only works once: just log in.
          </p>
        </div>
        <Link
          href="/auth"
          className="mt-6 inline-block px-4 py-2 rounded-full bg-pink-600 text-white font-semibold hover:bg-pink-700
                    focus:outline-none focus:ring-2 focus:ring-pink-400"
        >
          Go to login
        </Link>
      </div>
    </div>
  );
}