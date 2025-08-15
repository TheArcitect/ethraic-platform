import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// Logs voice-related events (TTS playback, mic toggle, etc.)
export async function POST(req: Request) {
  try {
    const { sessionId, kind, payload } = await req.json()
    if (!kind) {
      return NextResponse.json({ ok: false, error: 'kind required' }, { status: 400 })
    }
    // Create a new session if none provided
    let sid = sessionId as string | undefined
    if (!sid) {
      const { data, error } = await supabase.from('sessions').insert({}).select('id').single()
      if (error) throw error
      sid = data?.id as string
    }
    // Insert event row
    const { error: insertErr } = await supabase.from('voice_events').insert({
      session_id: sid,
      kind,
      payload
    })
    if (insertErr) throw insertErr
    return NextResponse.json({ ok: true, sessionId: sid })
  } catch (err: any) {
    console.error('Error in voice API:', err)
    return NextResponse.json({ ok: false, error: err?.message || 'Unknown error' }, { status: 500 })
  }
}
