"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import { useRouter } from "next/router";

export default function Login() {
    // const router = useRouter();
    const { data: session } = useSession();


    const handleLogin = async () => {
        const result = await signIn("google"); // Use the authentication method you are using
    
   
      };

    if (session?.user) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
                <h1 className="text-2xl font-bold">Welcome, {session.user.name}!</h1>
                <p className="text-gray-700">Email: {session.user.email}</p>
                <img
                    src={session.user.image ?? "/default-avatar.png"}
                    alt="User Image"
                    className="w-16 h-16 rounded-full mt-4"
                />
                <button
                    onClick={() => signOut()}
                    className="mt-6 bg-red-500 text-white py-2 px-4 rounded hover:bg-red-600"
                >
                    Sign Out
                </button>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-[#0e0f14]">
            <h1 className="text-3xl font-bold mb-8">Login or Sign Up</h1>
            <button onClick={handleLogin} className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600">
                Sign in with Google
            </button>
        </div>
    );
}
