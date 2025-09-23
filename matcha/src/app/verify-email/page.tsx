// matcha/src/app/verify-email/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    async function verify() {
      const token = searchParams.get("token");
      if (!token) {
        setStatus("error");
        setMessage("Token manquant ❌");
        return;
      }

      try {
        const res = await fetch(`/api/verify-email?token=${token}`);
        const data = await res.json();

        if (data.success) {
          setStatus("success");
          setMessage("Ton email a bien été vérifié 🎉");
          setTimeout(() => router.push("/auth"), 3000); // redirige vers login
        } else {
          setStatus("error");
          setMessage(data.error || "Erreur inconnue ❌");
        }
      } catch (err) {
        setStatus("error");
        setMessage("Erreur réseau ❌");
      }
    }

    verify();
  }, [searchParams, router]);

  return (
    <div className="flex items-center justify-center h-full">
      <div className="bg-white shadow-lg rounded-xl p-8 text-center w-96">
        {status === "loading" && (
          <p className="text-gray-600 animate-pulse">Vérification en cours...</p>
        )}
        {status === "success" && (
          <p className="text-green-600 font-bold">{message}</p>
        )}
        {status === "error" && (
          <p className="text-red-600 font-bold">{message}</p>
        )}
      </div>
    </div>
  );
}