"use server"

import { createClient } from '@/lib/supabase/server'

export interface Note {
  id: string
  user_id: string
  title: string
  subject_id: string | null
  chapter: string | null
  content: string | null
  tags: string[]
  created_at: string
  updated_at: string
  subjects?: {
    name: string
    color: string
  } | null
}

export async function getNotes(userId?: string) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  const targetUserId = userId || user?.id
  
  if (!targetUserId) return { notes: [], subjects: [], userId: null }
  
  const { data: notes, error } = await supabase
    .from('notes')
    .select(`
      *,
      subjects (name, color)
    `)
    .eq('user_id', targetUserId)
    .order('updated_at', { ascending: false })
  
  if (error) {
    console.error('Error fetching notes:', error)
    return { notes: [], subjects: [], userId: targetUserId }
  }
  
  // Get subjects for filter dropdown
  const { data: subjects } = await supabase
    .from('subjects')
    .select('id, name, color')
    .order('name')
  
  return {
    notes: notes || [],
    subjects: subjects || [],
    userId: targetUserId
  }
}

export async function getNote(noteId: string) {
  const supabase = await createClient()
  
  const { data: note, error } = await supabase
    .from('notes')
    .select(`
      *,
      subjects (name, color)
    `)
    .eq('id', noteId)
    .single()
  
  if (error) {
    console.error('Error fetching note:', error)
    return null
  }
  
  return note
}

export async function createNote(note: {
  userId: string
  title: string
  subjectId?: string
  chapter?: string
  content?: string
  tags?: string[]
}) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('notes')
    .insert({
      user_id: note.userId,
      title: note.title,
      subject_id: note.subjectId || null,
      chapter: note.chapter || null,
      content: note.content || '',
      tags: note.tags || []
    })
    .select()
    .single()
  
  return { data, error }
}

export async function updateNote(noteId: string, updates: {
  title?: string
  subjectId?: string
  chapter?: string
  content?: string
  tags?: string[]
}) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('notes')
    .update({
      title: updates.title,
      subject_id: updates.subjectId,
      chapter: updates.chapter,
      content: updates.content,
      tags: updates.tags,
      updated_at: new Date().toISOString()
    })
    .eq('id', noteId)
    .select()
    .single()
  
  return { data, error }
}

export async function deleteNote(noteId: string) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('notes')
    .delete()
    .eq('id', noteId)
  
  return { error }
}

export async function searchNotes(userId: string, query: string) {
  const supabase = await createClient()
  
  const { data: notes, error } = await supabase
    .from('notes')
    .select(`
      *,
      subjects (name, color)
    `)
    .eq('user_id', userId)
    .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
    .order('updated_at', { ascending: false })
  
  if (error) {
    console.error('Error searching notes:', error)
    return []
  }
  
  return notes || []
}
