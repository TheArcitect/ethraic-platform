// lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

// Database types
export interface UserProfile {
  id: string
  email: string
  name: string
  plan: 'Free' | 'Pro' | 'Max'
  created_at: string
  updated_at: string
  preferences: {
    voiceEnabled: boolean
    theme: 'dark' | 'light'
    condensation: boolean
    particles: boolean
    autoSave: boolean
    coThinking: boolean
  }
  metrics_summary?: {
    totalSessions: number
    totalBreakthroughs: number
    averageClarity: number
    averageDepth: number
  }
}

export interface ThoughtThread {
  id: string
  user_id: string
  title: string
  created_at: string
  updated_at: string
  last_active: string
  messages: Message[]
  metrics: any
  breakthrough_count: number
  phase_progression: string[]
  tags?: string[]
}

export interface Message {
  id: string
  thread_id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  metrics?: {
    clarity: number
    depth: number
    paradigmShift: number
  }
  condensed?: boolean
}

export interface Session {
  id: string
  user_id: string
  thread_id?: string
  started_at: string
  ended_at?: string
  duration_seconds: number
  exchange_count: number
  peak_metrics: {
    clarity: number
    depth: number
    paradigmShift: number
    flowState: number
  }
  breakthroughs: Breakthrough[]
}

export interface Breakthrough {
  id: string
  session_id: string
  thread_id: string
  timestamp: string
  type: 'convergence' | 'divergence' | 'emergence' | 'transcendence' | 'integration'
  intensity: number
  trigger_message?: string
  metrics_snapshot: any
  description: string
}

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database operations
export class EthraicDatabase {
  // User operations
  async createUser(email: string, name: string): Promise<UserProfile | null> {
    try {
      const { data, error } = await supabase
        .from('users')
        .insert({
          email,
          name,
          plan: 'Free',
          preferences: {
            voiceEnabled: true,
            theme: 'dark',
            condensation: true,
            particles: true,
            autoSave: true,
            coThinking: false
          }
        })
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error creating user:', error)
      return null
    }
  }

  async getUser(userId: string): Promise<UserProfile | null> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error fetching user:', error)
      return null
    }
  }

  async updateUserPreferences(userId: string, preferences: any): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('users')
        .update({ 
          preferences,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)

      if (error) throw error
      return true
    } catch (error) {
      console.error('Error updating preferences:', error)
      return false
    }
  }

  // Thread operations
  async createThread(userId: string, title?: string): Promise<ThoughtThread | null> {
    try {
      const { data, error } = await supabase
        .from('thought_threads')
        .insert({
          user_id: userId,
          title: title || `Thread ${new Date().toLocaleDateString()}`,
          messages: [],
          metrics: {},
          breakthrough_count: 0,
          phase_progression: ['SURFACE']
        })
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error creating thread:', error)
      return null
    }
  }

  async getThreads(userId: string, limit: number = 20): Promise<ThoughtThread[]> {
    try {
      const { data, error } = await supabase
        .from('thought_threads')
        .select('*')
        .eq('user_id', userId)
        .order('last_active', { ascending: false })
        .limit(limit)

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching threads:', error)
      return []
    }
  }

  async updateThread(
    threadId: string, 
    updates: {
      messages?: Message[]
      metrics?: any
      last_active?: string
      breakthrough_count?: number
      phase_progression?: string[]
    }
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('thought_threads')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
          last_active: updates.last_active || new Date().toISOString()
        })
        .eq('id', threadId)

      if (error) throw error
      return true
    } catch (error) {
      console.error('Error updating thread:', error)
      return false
    }
  }

  async deleteThread(threadId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('thought_threads')
        .delete()
        .eq('id', threadId)

      if (error) throw error
      return true
    } catch (error) {
      console.error('Error deleting thread:', error)
      return false
    }
  }

  // Message operations
  async addMessage(
    threadId: string,
    role: 'user' | 'assistant',
    content: string,
    metrics?: any
  ): Promise<Message | null> {
    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          thread_id: threadId,
          role,
          content,
          metrics,
          timestamp: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error
      
      // Update thread's last_active
      await this.updateThread(threadId, {
        last_active: new Date().toISOString()
      })

      return data
    } catch (error) {
      console.error('Error adding message:', error)
      return null
    }
  }

  async getMessages(threadId: string): Promise<Message[]> {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('thread_id', threadId)
        .order('timestamp', { ascending: true })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching messages:', error)
      return []
    }
  }

  // Session operations
  async createSession(userId: string, threadId?: string): Promise<Session | null> {
    try {
      const { data, error } = await supabase
        .from('sessions')
        .insert({
          user_id: userId,
          thread_id: threadId,
          started_at: new Date().toISOString(),
          duration_seconds: 0,
          exchange_count: 0,
          peak_metrics: {
            clarity: 0,
            depth: 0,
            paradigmShift: 0,
            flowState: 0
          },
          breakthroughs: []
        })
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error creating session:', error)
      return null
    }
  }

  async updateSession(
    sessionId: string,
    updates: {
      duration_seconds?: number
      exchange_count?: number
      peak_metrics?: any
      ended_at?: string
    }
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('sessions')
        .update(updates)
        .eq('id', sessionId)

      if (error) throw error
      return true
    } catch (error) {
      console.error('Error updating session:', error)
      return false
    }
  }

  // Breakthrough operations
  async recordBreakthrough(
    sessionId: string,
    threadId: string,
    breakthrough: {
      type: Breakthrough['type']
      intensity: number
      trigger_message?: string
      metrics_snapshot: any
      description: string
    }
  ): Promise<Breakthrough | null> {
    try {
      const { data, error } = await supabase
        .from('breakthroughs')
        .insert({
          session_id: sessionId,
          thread_id: threadId,
          ...breakthrough,
          timestamp: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error
      
      // Update thread breakthrough count
      const thread = await supabase
        .from('thought_threads')
        .select('breakthrough_count')
        .eq('id', threadId)
        .single()
      
      if (thread.data) {
        await this.updateThread(threadId, {
          breakthrough_count: (thread.data.breakthrough_count || 0) + 1
        })
      }

      return data
    } catch (error) {
      console.error('Error recording breakthrough:', error)
      return null
    }
  }

  async getBreakthroughs(userId: string, limit: number = 10): Promise<Breakthrough[]> {
    try {
      const { data, error } = await supabase
        .from('breakthroughs')
        .select(`
          *,
          sessions!inner(user_id)
        `)
        .eq('sessions.user_id', userId)
        .order('timestamp', { ascending: false })
        .limit(limit)

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching breakthroughs:', error)
      return []
    }
  }

  // Analytics operations
  async getUserAnalytics(userId: string): Promise<any> {
    try {
      // Get session stats
      const { data: sessions, error: sessionsError } = await supabase
        .from('sessions')
        .select('duration_seconds, exchange_count, peak_metrics')
        .eq('user_id', userId)

      if (sessionsError) throw sessionsError

      // Get breakthrough stats
      const { data: breakthroughs, error: breakthroughsError } = await supabase
        .from('breakthroughs')
        .select(`
          type,
          intensity,
          sessions!inner(user_id)
        `)
        .eq('sessions.user_id', userId)

      if (breakthroughsError) throw breakthroughsError

      // Calculate analytics
      const totalSessions = sessions?.length || 0
      const totalBreakthroughs = breakthroughs?.length || 0
      const totalDuration = sessions?.reduce((sum, s) => sum + s.duration_seconds, 0) || 0
      const totalExchanges = sessions?.reduce((sum, s) => sum + s.exchange_count, 0) || 0
      
      const avgClarity = sessions?.reduce((sum, s) => sum + (s.peak_metrics?.clarity || 0), 0) / Math.max(totalSessions, 1)
      const avgDepth = sessions?.reduce((sum, s) => sum + (s.peak_metrics?.depth || 0), 0) / Math.max(totalSessions, 1)
      
      const breakthroughTypes = breakthroughs?.reduce((acc: any, b) => {
        acc[b.type] = (acc[b.type] || 0) + 1
        return acc
      }, {})

      return {
        totalSessions,
        totalBreakthroughs,
        totalDuration,
        totalExchanges,
        averageClarity: Math.round(avgClarity),
        averageDepth: Math.round(avgDepth),
        breakthroughsPerSession: totalBreakthroughs / Math.max(totalSessions, 1),
        breakthroughTypes,
        lastSessionDate: sessions?.[0]?.started_at
      }
    } catch (error) {
      console.error('Error fetching analytics:', error)
      return null
    }
  }

  // Search operations
  async searchThreads(userId: string, query: string): Promise<ThoughtThread[]> {
    try {
      const { data, error } = await supabase
        .from('thought_threads')
        .select('*')
        .eq('user_id', userId)
        .or(`title.ilike.%${query}%,messages.cs.{content: ${query}}`)
        .order('last_active', { ascending: false })
        .limit(20)

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error searching threads:', error)
      return []
    }
  }

  // Export operations
  async exportUserData(userId: string): Promise<any> {
    try {
      const [user, threads, sessions, breakthroughs] = await Promise.all([
        this.getUser(userId),
        this.g