import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async signIn({ user, account, profile }) {
      // Check if the user already exists in the database
      const existingUser = await prisma.user.findUnique({
        where: { email: user.email },
      });

      if (!existingUser) {
        // Create a new user if they don't exist
        await prisma.user.create({
          data: {
            email: user.email,
            googleId: account.providerAccountId,
            username: profile.name || null,
            image: user.image || null,
          },
        });
      }

      return true; // Allow sign-in
    },
    async session({ session, token }) {
      // Attach user ID to the session object
      if (token?.sub) {
        session.user.id = token.sub;

        // Optionally fetch user details from the database
        const dbUser = await prisma.user.findUnique({
          where: { googleId: token.sub },
        });

        if (dbUser) {
          session.user.image = dbUser.image;
          session.user.username = dbUser.username;
        }
      }
      return session;
    },
  },
});

export { handler as GET, handler as POST };
