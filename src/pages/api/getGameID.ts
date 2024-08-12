import type { NextApiRequest, NextApiResponse } from 'next'
import { API_BASE_URL } from '../../utils/api'

type SessionResponse = {
  gameId: number
}

type GetGameIDResponse = {
  gameID?: number
  error?: string
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<GetGameIDResponse>) {
  console.log('req.method:', req.method)
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { sessionToken } = req.query
  console.log('sessionToken:', sessionToken)

  if (!sessionToken || Array.isArray(sessionToken)) {
    return res.status(400).json({ error: 'Invalid sessionToken' })
  }

  try {
    const sessionResponse = await fetch(`${API_BASE_URL}/games/session?token=${sessionToken}`)

    console.log('sessionResponse status:', sessionResponse.status)

    if (!sessionResponse.ok) {
      throw new Error(`Failed to retrieve session: ${sessionResponse.status}`)
    }

    const sessionData: SessionResponse = await sessionResponse.json()
    console.log('sessionData:', sessionData)

    if (!sessionData.gameId) {
      throw new Error('Game ID not found in session data')
    }

    res.status(200).json({ gameID: sessionData.gameId })
  } catch (error) {
    console.error('Error fetching game ID:', error)
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to fetch game ID' })
  }
}
