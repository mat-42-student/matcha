export default function VerifySuccess() {
  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-2xl shadow-md text-center max-w-md">
        <h1 className="text-2xl font-bold text-green-600">Email Verified!</h1>
        <p className="mt-4 text-gray-700">
          Your email address has been successfully verified. You can now log in 🎉
        </p>
      </div>
    </div>
  );
}