import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// This route runs on the server (Node.js runtime on Vercel), so it can
// safely use the SERVICE ROLE key, which must never be exposed to the browser.
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  const { senderId, receiverId, content } = await req.json();

  if (!senderId || !receiverId || !content) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from('messages')
    .insert({ sender_id: senderId, receiver_id: receiverId, content })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ data });
}
