import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Initialize Supabase client
// Note: In a production app, use process.env.NEXT_PUBLIC_SUPABASE_URL and process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://sfniyudipwsaqwuhsdcq.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNmbml5dWRpcHdzYXF3dWhzZGNxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjAyNDc5MDcsImV4cCI6MjAzNTgyMzkwN30.JZnzWXjTRSSvSiN4iK__QUY2DmXF2_wB27zjSG3THLs';
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('email_signups')
      .insert([{ email, source: 'landing_page' }]);

    if (error) {
      // Handle unique constraint violation (email already exists) gracefully
      if (error.code === '23505') {
        return NextResponse.json({ message: 'Email already registered' }, { status: 200 });
      }
      throw error;
    }

    return NextResponse.json({ message: 'Success' }, { status: 200 });
  } catch (error) {
    console.error('Error saving email:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
