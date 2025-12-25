import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { user } from "@/db/schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { eq, sql } from "drizzle-orm";

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  
  if (!session || (session.user as any).role !== 'admin') {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { userId, dataAmount, pivotPoints } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    const updateData: any = {};
    if (dataAmount !== undefined) {
      updateData.dataBalance = sql`${user.dataBalance} + ${dataAmount}`;
    }
    if (pivotPoints !== undefined) {
      updateData.pivotPoints = sql`${user.pivotPoints} + ${pivotPoints}`;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
    }

    await db.update(user)
      .set(updateData)
      .where(eq(user.id, userId));

    return NextResponse.json({ success: true, message: "Recharge successful" });
  } catch (error) {
    console.error("Error recharging user:", error);
    return NextResponse.json({ error: "Failed to recharge user" }, { status: 500 });
  }
}
