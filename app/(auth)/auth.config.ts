import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
  pages: {
    signIn: '/auth',
    newUser: '/chat',
  },
  providers: [
    // added later in auth.ts since it requires bcrypt which is only compatible with Node.js
    // while this file is also used in non-Node.js environments
  ],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnChat = nextUrl.pathname === '/chat';
      const isOnAuth = nextUrl.pathname.startsWith('/auth');

      if (isOnAuth) {
        return true; // Always allow access to login page
      }

      if (isOnChat) {
        // Redirect unauthenticated users to login page
        return isLoggedIn;
      }

      // if (isLoggedIn) {
      //   return Response.redirect(new URL('/', nextUrl as unknown as URL));
      // }

      return true;
    },
  },
} satisfies NextAuthConfig;
