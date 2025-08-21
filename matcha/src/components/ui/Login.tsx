import { LoginForm  } from "@/components/forms/LoginForm";

export function Login() {
  return (
    <>
      <div>
        <h1 className="text-6xl text-pink-800">Bienvenue sur Matcha</h1>
      </div>
      <LoginForm />
    </>
  );
}