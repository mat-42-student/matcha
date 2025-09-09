import { randomUUID } from "node:crypto";

export async function loginUser(
    email: string,
    password: string
) {
    return {id :1, email:"toto", passwordHash:"hashdepass"};
}

export async function createSession(id: number) {
    return randomUUID()
}