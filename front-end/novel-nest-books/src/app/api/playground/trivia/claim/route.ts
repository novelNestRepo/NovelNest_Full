import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { db } from '@/db';
import { prizeClaims } from '@/db/schema';

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing token' }, { status: 401 });
    }
    const token = authHeader.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { shippingAddress, itemDescription } = await req.json();

    if (!shippingAddress) {
      return NextResponse.json({ error: 'Shipping address is required' }, { status: 400 });
    }

    await db.insert(prizeClaims).values({
      userId: user.id,
      itemDescription: itemDescription || 'NovelNest Trivia Grand Prize Book',
      shippingAddress,
      status: 'pending',
    });

    return NextResponse.json({ success: true, message: 'Prize claimed successfully!' });

  } catch (error) {
    console.error('Error claiming prize:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
