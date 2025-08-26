import { LoginForm  } from "@/components/forms/LoginForm";

export function Login() {
  return (
    <div className="w-full max-w-md p-6 bg-white rounded-2xl shadow-lg text-center">
      <h1 className="text-4xl font-bold text-pink-800 mb-6">
        Bienvenue sur Matcha
      </h1>
      <LoginForm />
    </div>
  );
}