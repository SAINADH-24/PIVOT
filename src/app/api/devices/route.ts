import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { udiDevices, users } from '@/db/schema';
import { eq, like, and, or, desc } from 'drizzle-orm';

// Validation helpers
function isValidPhoneNumber(phone: string): boolean {
  // E.164 format: starts with +, followed by 1-15 digits
  const e164Regex = /^\+[1-9]\d{1,14}$/;
  return e164Regex.test(phone);
}

function isValidDeviceType(type: string): boolean {
  return ['phone', 'laptop', 'tablet'].includes(type);
}

function isValidStatus(status: string): boolean {
  return ['active', 'inactive'].includes(status);
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // Single device by ID
    if (id) {
      if (!id || isNaN(parseInt(id))) {
        return NextResponse.json(
          { error: 'Valid ID is required', code: 'INVALID_ID' },
          { status: 400 }
        );
      }

      const device = await db
        .select()
        .from(udiDevices)
        .where(eq(udiDevices.id, parseInt(id)))
        .limit(1);

      if (device.length === 0) {
        return NextResponse.json(
          { error: 'Device not found', code: 'DEVICE_NOT_FOUND' },
          { status: 404 }
        );
      }

      return NextResponse.json(device[0], { status: 200 });
    }

    // List devices with filters
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '10'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const userId = searchParams.get('userId');
    const phoneNumber = searchParams.get('phoneNumber');
    const udiId = searchParams.get('udiId');

    let query = db.select().from(udiDevices);
    const conditions = [];

    // Apply filters
    if (userId) {
      if (isNaN(parseInt(userId))) {
        return NextResponse.json(
          { error: 'Valid userId is required', code: 'INVALID_USER_ID' },
          { status: 400 }
        );
      }
      conditions.push(eq(udiDevices.userId, parseInt(userId)));
    }

    if (phoneNumber) {
      conditions.push(eq(udiDevices.phoneNumber, phoneNumber));
    }

    if (udiId) {
      conditions.push(eq(udiDevices.udiId, udiId));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const results = await query
      .orderBy(desc(udiDevices.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json(results, { status: 200 });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, name, type, phoneNumber, udiId, status, dataUsed, lastConnected } = body;

    // Validate required fields
    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required', code: 'MISSING_USER_ID' },
        { status: 400 }
      );
    }

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json(
        { error: 'name is required', code: 'MISSING_NAME' },
        { status: 400 }
      );
    }

    if (!type) {
      return NextResponse.json(
        { error: 'type is required', code: 'MISSING_TYPE' },
        { status: 400 }
      );
    }

    if (!isValidDeviceType(type)) {
      return NextResponse.json(
        { 
          error: 'type must be one of: phone, laptop, tablet', 
          code: 'INVALID_TYPE' 
        },
        { status: 400 }
      );
    }

    if (!phoneNumber) {
      return NextResponse.json(
        { error: 'phoneNumber is required', code: 'MISSING_PHONE_NUMBER' },
        { status: 400 }
      );
    }

    if (!isValidPhoneNumber(phoneNumber)) {
      return NextResponse.json(
        { 
          error: 'phoneNumber must be in E.164 format (e.g., +12345678900)', 
          code: 'INVALID_PHONE_FORMAT' 
        },
        { status: 400 }
      );
    }

    if (!udiId || typeof udiId !== 'string' || udiId.trim() === '') {
      return NextResponse.json(
        { error: 'udiId is required', code: 'MISSING_UDI_ID' },
        { status: 400 }
      );
    }

    // Validate status if provided
    if (status && !isValidStatus(status)) {
      return NextResponse.json(
        { 
          error: 'status must be one of: active, inactive', 
          code: 'INVALID_STATUS' 
        },
        { status: 400 }
      );
    }

    // Check if userId exists
    const userExists = await db
      .select()
      .from(users)
      .where(eq(users.id, parseInt(userId)))
      .limit(1);

    if (userExists.length === 0) {
      return NextResponse.json(
        { error: 'User not found', code: 'USER_NOT_FOUND' },
        { status: 400 }
      );
    }

    // Check if udiId is unique
    const existingDevice = await db
      .select()
      .from(udiDevices)
      .where(eq(udiDevices.udiId, udiId.trim()))
      .limit(1);

    if (existingDevice.length > 0) {
      return NextResponse.json(
        { error: 'udiId already exists', code: 'DUPLICATE_UDI_ID' },
        { status: 400 }
      );
    }

    // Create device
    const now = new Date().toISOString();
    const newDevice = await db
      .insert(udiDevices)
      .values({
        userId: parseInt(userId),
        name: name.trim(),
        type,
        phoneNumber: phoneNumber.trim(),
        udiId: udiId.trim(),
        status: status || 'active',
        dataUsed: dataUsed !== undefined ? parseFloat(dataUsed) : 0,
        lastConnected: lastConnected || null,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    return NextResponse.json(newDevice[0], { status: 201 });
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    // Check if device exists
    const existingDevice = await db
      .select()
      .from(udiDevices)
      .where(eq(udiDevices.id, parseInt(id)))
      .limit(1);

    if (existingDevice.length === 0) {
      return NextResponse.json(
        { error: 'Device not found', code: 'DEVICE_NOT_FOUND' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { name, type, status, phoneNumber, udiId, dataUsed, lastConnected } = body;

    // Validate type if provided
    if (type && !isValidDeviceType(type)) {
      return NextResponse.json(
        { 
          error: 'type must be one of: phone, laptop, tablet', 
          code: 'INVALID_TYPE' 
        },
        { status: 400 }
      );
    }

    // Validate status if provided
    if (status && !isValidStatus(status)) {
      return NextResponse.json(
        { 
          error: 'status must be one of: active, inactive', 
          code: 'INVALID_STATUS' 
        },
        { status: 400 }
      );
    }

    // Validate phoneNumber if provided
    if (phoneNumber && !isValidPhoneNumber(phoneNumber)) {
      return NextResponse.json(
        { 
          error: 'phoneNumber must be in E.164 format (e.g., +12345678900)', 
          code: 'INVALID_PHONE_FORMAT' 
        },
        { status: 400 }
      );
    }

    // Check udiId uniqueness if provided
    if (udiId && udiId !== existingDevice[0].udiId) {
      const duplicateCheck = await db
        .select()
        .from(udiDevices)
        .where(eq(udiDevices.udiId, udiId.trim()))
        .limit(1);

      if (duplicateCheck.length > 0) {
        return NextResponse.json(
          { error: 'udiId already exists', code: 'DUPLICATE_UDI_ID' },
          { status: 400 }
        );
      }
    }

    // Build update object
    const updates: any = {
      updatedAt: new Date().toISOString(),
    };

    if (name !== undefined) updates.name = name.trim();
    if (type !== undefined) updates.type = type;
    if (status !== undefined) updates.status = status;
    if (phoneNumber !== undefined) updates.phoneNumber = phoneNumber.trim();
    if (udiId !== undefined) updates.udiId = udiId.trim();
    if (dataUsed !== undefined) updates.dataUsed = parseFloat(dataUsed);
    if (lastConnected !== undefined) updates.lastConnected = lastConnected;

    const updatedDevice = await db
      .update(udiDevices)
      .set(updates)
      .where(eq(udiDevices.id, parseInt(id)))
      .returning();

    return NextResponse.json(updatedDevice[0], { status: 200 });
  } catch (error) {
    console.error('PATCH error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    // Check if device exists
    const existingDevice = await db
      .select()
      .from(udiDevices)
      .where(eq(udiDevices.id, parseInt(id)))
      .limit(1);

    if (existingDevice.length === 0) {
      return NextResponse.json(
        { error: 'Device not found', code: 'DEVICE_NOT_FOUND' },
        { status: 404 }
      );
    }

    const deleted = await db
      .delete(udiDevices)
      .where(eq(udiDevices.id, parseInt(id)))
      .returning();

    return NextResponse.json(
      { 
        message: 'Device deleted successfully',
        device: deleted[0]
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}