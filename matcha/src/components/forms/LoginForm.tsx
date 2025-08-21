'use_client';

export function LoginForm() {
    return (
    <form method="POST" action="/api/login">
      <input type="text" name="email" placeholder="Email" />
      <br/>
      <input type="password" name="password" placeholder="Password" />
      <br/>
      <button type="submit">Login</button>
    </form>
    )
}