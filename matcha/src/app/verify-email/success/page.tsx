export default function VerifySuccess() {
  return (
    <div className="flex flex-col items-center justify-center h-screen text-center">
      <h1 className="text-2xl font-bold text-green-600">✅ Email confirmé !</h1>
      <p className="mt-2 text-gray-700">
        Ton adresse email a été vérifiée avec succès. Tu peux maintenant te connecter 🎉
      </p>
    </div>
  );
}