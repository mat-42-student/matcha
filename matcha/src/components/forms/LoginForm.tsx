export function LoginForm() {
    return (
    <form method="POST" action="/api/login">
      <input type="text" name="email" placeholder="Email" />
      <input type="password" name="password" placeholder="Password" />
      <button type="submit">Login</button>
    </form>
    )
}