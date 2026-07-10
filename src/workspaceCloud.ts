import type { WorkspaceState } from './types'

type WorkspaceRow = {
  id: string
  payload: WorkspaceState
  updated_at: string
}

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.replace(/\/+$/, '')
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const workspaceId = import.meta.env.VITE_WORKSPACE_ID || 'personal-workspace'

const tableName = 'workspace_states'

const hasSupabaseConfig = Boolean(supabaseUrl && supabaseAnonKey)

export const isCloudWorkspaceEnabled = true

const cloudHeaders = () => ({
  apikey: supabaseAnonKey ?? '',
  Authorization: `Bearer ${supabaseAnonKey ?? ''}`,
  'Content-Type': 'application/json',
})

const workspaceUrl = () =>
  `${supabaseUrl}/rest/v1/${tableName}?id=eq.${encodeURIComponent(workspaceId)}&select=id,payload,updated_at&limit=1`

export const loadCloudWorkspace = async () => {
  if (!hasSupabaseConfig || !supabaseUrl) {
    const response = await fetch(`/api/workspace?id=${encodeURIComponent(workspaceId)}`)

    if (!response.ok) {
      throw new Error(`Cloud workspace load failed: ${response.status}`)
    }

    const data = await response.json() as { payload?: WorkspaceState | null }
    return data.payload ?? null
  }

  const response = await fetch(workspaceUrl(), {
    headers: cloudHeaders(),
  })

  if (!response.ok) {
    throw new Error(`Cloud workspace load failed: ${response.status}`)
  }

  const rows = await response.json() as WorkspaceRow[]
  return rows[0]?.payload ?? null
}

export const saveCloudWorkspace = async (state: WorkspaceState) => {
  if (!hasSupabaseConfig || !supabaseUrl) {
    const response = await fetch('/api/workspace', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: workspaceId,
        payload: state,
      }),
    })

    if (!response.ok) {
      throw new Error(`Cloud workspace save failed: ${response.status}`)
    }

    return true
  }

  const response = await fetch(`${supabaseUrl}/rest/v1/${tableName}?on_conflict=id`, {
    method: 'POST',
    headers: {
      ...cloudHeaders(),
      Prefer: 'resolution=merge-duplicates,return=minimal',
    },
    body: JSON.stringify({
      id: workspaceId,
      payload: state,
      updated_at: new Date().toISOString(),
    }),
  })

  if (!response.ok) {
    throw new Error(`Cloud workspace save failed: ${response.status}`)
  }

  return true
}
