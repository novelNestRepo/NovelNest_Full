import { NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { ne } from 'drizzle-orm';
import { supabase } from '@/lib/supabase';

// Get a list of users to suggest as friends
export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.split(' ')[1];

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch all users EXCEPT the current user
    const suggestedUsers = await db.query.users.findMany({
      where: ne(users.id, user.id),
      limit: 10,
    });

    return NextResponse.json(suggestedUsers, { status: 200 });
  } catch (error: any) {
    console.error('Fetch users error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}
