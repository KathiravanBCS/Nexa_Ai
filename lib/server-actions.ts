'use server'

import { getThreadsClient } from '@/lib/supabase/client'
import { revalidatePath } from 'next/cache'

export async function ensureThreadAction(title: string) {
  const supabase = getThreadsClient()
  
  // Get the current user if authenticated
  const { data: { user } } = await supabase.auth.getUser()
  const userId = user?.id || null
  
  const { data, error } = await supabase
    .from('threads')
    .insert([{ title: title.slice(0, 60), user_id: userId }])
    .select()
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return data.id
}

export async function saveMessageAction(threadId: string, message: any) {
  const supabase = getThreadsClient()
  
  const { error } = await supabase
    .from('messages')
    .insert([{ 
      thread_id: threadId, 
      role: message.role, 
      content: JSON.stringify(message.content) 
    }])

  if (error) {
    console.error('Error saving message:', error)
    throw new Error(error.message)
  }
  
  revalidatePath('/')
}