"use client"
import { createAuthClient } from "better-auth/react"
import { bearer } from "better-auth/plugins"
import { useEffect, useState } from "react"

export const authClient = createAuthClient({
    baseURL: typeof window !== 'undefined' ? window.location.origin : process.env.NEXT_PUBLIC_SITE_URL,
    plugins: [bearer()],
    fetchOptions: {
        onRequest: async (ctx) => {
            const token = typeof window !== 'undefined' ? localStorage.getItem("bearer_token") : null;
            if (token) {
                ctx.options.headers = {
                    ...ctx.options.headers,
                    Authorization: `Bearer ${token}`
                };
            }
            return ctx;
        },
        onSuccess: async (ctx) => {
            const authToken = ctx.response.headers.get("set-auth-token") || ctx.response.headers.get("Authorization");
            if (authToken) {
                const token = authToken.startsWith("Bearer ") ? authToken.split(" ")[1] : authToken;
                localStorage.setItem("bearer_token", token);
            } else {
                // Check body for token (some plugins return it there)
                try {
                    const clonedRes = ctx.response.clone();
                    const data = await clonedRes.json();
                    if (data.token) {
                        localStorage.setItem("bearer_token", data.token);
                    }
                } catch (e) {}
            }
        }
    }
});

type SessionData = ReturnType<typeof authClient.useSession>

export function useSession() {
   const { data: session, isPending, error, refetch } = authClient.useSession();
   return { data: session, isPending, error, refetch };
}