import { NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq, or } from 'drizzle-orm';

export async function POST(request: Request) {
  try {
    const { email, name } = await request.json();

    if (!email || !name) {
      return NextResponse.json(
        { error: 'Email and Username are required' },
        { status: 400 }
      );
    }

    // Check if a user with this email or name already exists in Drizzle public.users
    const existingUser = await db.query.users.findFirst({
      where: or(
        eq(users.email, email.toLowerCase()),
        eq(users.name, name)
      ),
    });

    if (existingUser) {
      if (existingUser.email.toLowerCase() === email.toLowerCase()) {
        return NextResponse.json(
          { error: 'Email is already registered' },
          { status: 400 }
        );
      }
      if (existingUser.name === name) {
        return NextResponse.json(
          { error: 'Username is already taken' },
          { status: 400 }
        );
      }
    }

    return NextResponse.json({ available: true }, { status: 200 });
  } catch (error: any) {
    console.error('Check availability error:', error);
    return NextResponse.json(
      { error: 'Failed to validate user availability' },
      { status: 500 }
    );
  }
}
