import NextAuth, { type Session } from 'next-auth';
import 'next-auth/jwt';
import Credentials from 'next-auth/providers/credentials';

import { authConfig } from './auth.config';
import { getUser } from '@/lib/db/queries';

declare module "next-auth" {
  interface User {
    id?: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    countryCode: string;
    phoneNumber: string;
    firstName: string | null;
    lastName: string | null;
    isAdmin: boolean | null;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    phoneNumber: string;
    countryCode: string;
    firstName: string | null;
    lastName: string | null;
    isAdmin: boolean | null;
  }
}

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        phoneNumber: {},
        countryCode: {},
      },
      async authorize({ phoneNumber, countryCode }) {
        const user = await getUser(phoneNumber as string, countryCode as string);
        return user === null ? null : { id: user.id, phoneNumber: user.phoneNumber, countryCode: user.countryCode, firstName: user.firstName, lastName: user.lastName, isAdmin: user.isAdmin };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user?.id) {
        token.id = user.id;
        token.phoneNumber = user.phoneNumber;
        token.countryCode = user.countryCode;
        token.firstName = user.firstName;
        token.lastName = user.lastName;
        token.isAdmin = user.isAdmin;
      }

      return token;
    },
    async session({
      session,
      token,
    }: {
      session: Session;
      token: {
        id: string;
        phoneNumber: string;
        countryCode: string;
        firstName: string | null;
        lastName: string | null;
        isAdmin: boolean | null;
      };
    }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.phoneNumber = token.phoneNumber;
        session.user.countryCode = token.countryCode;
        session.user.firstName = token.firstName;
        session.user.lastName = token.lastName;
        session.user.isAdmin = token.isAdmin;
      }
      
      return session;
    },
  },
});
