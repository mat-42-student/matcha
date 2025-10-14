"use client";

import { useSearchParams } from "next/navigation";

export default function VerifyError() {
  const searchParams = useSearchParams();
  const reason = searchParams.get("reason");

  let message = "An error occurred.";
  if (reason === "missing") message = "Invalid verification link (missing token).";
  if (reason === "invalid") message = "This verification link is invalid.";
  if (reason === "expired") message = "This link has expired. Request a new verification email.";
  if (reason === "server") message = "Internal server error. Please try again later.";

  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-2xl shadow-md text-center max-w-md">
        <h1 className="text-2xl font-bold text-red-600">❌ Verification Failed</h1>
        <p className="mt-4 text-gray-700">{message}</p>
      </div>
    </div>
  );
}