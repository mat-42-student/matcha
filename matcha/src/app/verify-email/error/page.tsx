"use client";

import { useSearchParams } from "next/navigation";

export default function VerifyError() {
  const searchParams = useSearchParams();
  const reason = searchParams.get("reason");

  let message = "Une erreur est survenue.";
  if (reason === "missing") message = "Lien de vérification invalide (token manquant).";
  if (reason === "invalid") message = "Ce lien de vérification est invalide.";
  if (reason === "expired") message = "Ce lien a expiré, demande un nouvel email de vérification.";
  if (reason === "server") message = "Erreur interne. Réessaie plus tard.";

  return (
    <div className="flex flex-col items-center justify-center h-screen text-center">
      <h1 className="text-2xl font-bold text-red-600">❌ Échec de la vérification</h1>
      <p className="mt-2 text-gray-700">{message}</p>
    </div>
  );
}