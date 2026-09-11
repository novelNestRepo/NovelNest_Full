import { NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { supabase } from '@/lib/supabase';

// Called after Supabase signup to ensure the public.users row has the correct role
export async function POST(request: Request) {
  try {
    const { userId, email, name, role } = await request.json();

    if (!userId || !email) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if user already exists in public.users
    const existingUser = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (existingUser) {
      // Update the role if it was set during registration
      const [updatedUser] = await db
        .update(users)
        .set({
          role: role || 'user',
          name: name || existingUser.name,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId))
        .returning();

      return NextResponse.json(updatedUser, { status: 200 });
    } else {
      // Create the user row manually with the correct role
      const [newUser] = await db
        .insert(users)
        .values({
          id: userId,
          email: email.toLowerCase(),
          passwordHash: 'supabase-managed', // Supabase handles passwords, this is just a placeholder
          name: name || null,
          role: role || 'user',
        })
        .returning();

      return NextResponse.json(newUser, { status: 201 });
    }
  } catch (error: any) {
    console.error('Sync user error:', error);
    return NextResponse.json(
      { error: 'Failed to sync user profile' },
      { status: 500 }
    );
  }
}
