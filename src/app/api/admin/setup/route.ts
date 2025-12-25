import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { user } from "@/db/schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  
  if (!session) {
    return NextResponse.json({ error: "Please login first" }, { status: 401 });
  }

  try {
    // Promote the currently logged in user to admin
    await db.update(user)
      .set({ role: 'admin' })
      .where(eq(user.id, session.user.id));

    return NextResponse.json({ 
      success: true, 
      message: `User ${session.user.email} promoted to admin. Please log out and log back in to see changes.` 
    });
  } catch (error) {
    console.error("Error setting up admin:", error);
    return NextResponse.json({ error: "Failed to setup admin. The 'role' column might not exist yet or database is busy." }, { status: 500 });
  }
}
