import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// Returns message history for a session
export async function POST(req: Request) {
  try {
    const { sessionId } = await req.json()
    if (!sessionId) {
      return NextResponse.json({ messages: [] })
    }
    const { data, error } = await supabase
      .from('messages')
      .select('role, content, created_at')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true })
      .limit(100)
    if (error) throw error
    return NextResponse.json({ messages: data || [] })
  } catch (err: any) {
    console.error('Error in history API:', err)
    return NextResponse.json({ messages: [] })
  }
}
