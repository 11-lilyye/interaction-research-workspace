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

export const isCloudWorkspaceEnabled = Boolean(supabaseUrl && supabaseAnonKey)

const cloudHeaders = () => ({
  apikey: supabaseAnonKey ?? '',
  Authorization: `Bearer ${supabaseAnonKey ?? ''}`,
  'Content-Type': 'application/json',
})

const workspaceUrl = () =>
  `${supabaseUrl}/rest/v1/${tableName}?id=eq.${encodeURIComponent(workspaceId)}&select=id,payload,updated_at&limit=1`

export const loadCloudWorkspace = async () => {
  if (!isCloudWorkspaceEnabled || !supabaseUrl) return null

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
  if (!isCloudWorkspaceEnabled || !supabaseUrl) return false

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
