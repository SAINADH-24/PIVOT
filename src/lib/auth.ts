import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { bearer } from "better-auth/plugins";
import { NextRequest } from 'next/server';
import { headers } from "next/headers"
import { db } from "@/db";
 
export const auth = betterAuth({
	database: drizzleAdapter(db, {
		provider: "sqlite",
	}),
	emailAndPassword: {    
		enabled: true
	},
    user: {
        additionalFields: {
            phoneNumber: { type: "string", required: false },
            udi: { 
                type: "string", 
                defaultValue: () => `UDI-${Math.random().toString(36).substring(2, 9).toUpperCase()}` 
            },
            dataBalance: { type: "number", defaultValue: 15.5 },
            pivotPoints: { type: "number", defaultValue: 1250 },
            role: { type: "string", defaultValue: "user" },
        }
    },
	plugins: [bearer()]
});

// Session validation helper
export async function getCurrentUser(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user || null;
}