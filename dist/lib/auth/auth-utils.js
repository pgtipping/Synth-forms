'use server';
import { hash, compare } from 'bcrypt';
const SALT_ROUNDS = 10;
export async function hashPassword(password) {
    return await hash(password, SALT_ROUNDS);
}
export async function verifyPassword(password, hashedPassword) {
    return await compare(password, hashedPassword);
}
