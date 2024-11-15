"use client"; // Enables client-side rendering

import { SessionProvider } from "next-auth/react";

export function SessionProviderWrapper({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <SessionProvider>{children}</SessionProvider>;
}
