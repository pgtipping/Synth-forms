import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { verifyPassword } from './auth-utils';
import { prisma } from './prisma';

// Mark this file as server-only
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            return null;
          }

          const user = await prisma.user.findUnique({
            where: {
              email: credentials.email
            },
            select: {
              id: true,
              email: true,
              name: true,
              role: true
            }
          });

          if (!user) {
            return null;
          }

          // For demo purposes, we'll use a hardcoded password
          // TODO: Implement proper password storage mechanism
          const DEMO_PASSWORD_HASH = process.env.DEMO_PASSWORD_HASH || "$2b$10$demopasswordhash";
          
          const isPasswordValid = await verifyPassword(
            credentials.password,
            DEMO_PASSWORD_HASH
          );

          if (!isPasswordValid) {
            return null;
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
          };
        } catch (error) {
          console.error('Auth error:', error);
          return null;
        }
      }
    })
  ],
  session: {
    strategy: 'jwt'
  },
  pages: {
    signIn: '/login'
  },
  secret: process.env.NEXTAUTH_SECRET,
};
