"use client"
import { createAuthClient } from "better-auth/react"
import { bearer } from "better-auth/plugins"
import { useEffect, useState } from "react"

export const authClient = createAuthClient({
    baseURL: typeof window !== 'undefined' ? window.location.origin : process.env.NEXT_PUBLIC_SITE_URL,
    plugins: [bearer()],
});

type SessionData = ReturnType<typeof authClient.useSession>

export function useSession() {
   const { data: session, isPending, error, refetch } = authClient.useSession();
   return { data: session, isPending, error, refetch };
}