import { connectLambda, getStore } from '@netlify/blobs'

const json = (statusCode, body) => ({
  statusCode,
  headers: {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store',
  },
  body: JSON.stringify(body),
})

const workspaceKey = (id = 'personal-workspace') =>
  `workspace:${String(id).replace(/[^a-zA-Z0-9._:-]/g, '-')}`

export const handler = async (event) => {
  connectLambda(event)
  const store = getStore('interaction-research-workspaces')

  if (event.httpMethod === 'GET') {
    const id = event.queryStringParameters?.id || 'personal-workspace'
    const payload = await store.get(workspaceKey(id), { type: 'json' })
    return json(200, {
      id,
      payload: payload?.payload ?? null,
      updated_at: payload?.updated_at ?? null,
    })
  }

  if (event.httpMethod === 'POST') {
    const body = JSON.parse(event.body || '{}')
    const id = body.id || 'personal-workspace'
    const payload = body.payload

    if (!payload?.projects) {
      return json(400, { error: 'Workspace payload with projects is required.' })
    }

    const updatedAt = new Date().toISOString()
    await store.setJSON(workspaceKey(id), {
      payload,
      updated_at: updatedAt,
    })

    return json(200, {
      id,
      updated_at: updatedAt,
    })
  }

  return json(405, { error: 'Method not allowed.' })
}
