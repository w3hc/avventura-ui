import type { NextApiRequest, NextApiResponse } from 'next'
import { API_BASE_URL } from '../../utils/api'

type CurrentStepResponse = {
  currentStep: number
  error?: string
}

type SessionResponse = {
  gameId: number
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<CurrentStepResponse>) {
  console.log('req.method:', req.method)
  if (req.method !== 'GET') {
    return res.status(405).json({ currentStep: 0, error: 'Method not allowed' })
  }

  const { sessionToken } = req.query
  console.log('sessionToken:', sessionToken)

  if (!sessionToken) {
    return res.status(400).json({ currentStep: 0, error: 'Invalid sessionToken' })
  }

  try {
    const sessionResponse = await fetch(`${API_BASE_URL}/games/session?token=${sessionToken}`)

    console.log('sessionResponse:', sessionResponse)

    if (!sessionResponse.ok) {
      throw new Error('Failed to retrieve session')
    }

    const sessionData: SessionResponse = await sessionResponse.json()
    console.log('sessionData:', sessionData)

    const sessionId = sessionData.gameId

    const gameStateResponse = await fetch(`${API_BASE_URL}/games/${sessionId}`, {
      headers: {
        Authorization: `Bearer ${sessionToken}`,
      },
    })

    if (!gameStateResponse.ok) {
      throw new Error('Failed to fetch game state')
    }

    const gameData = await gameStateResponse.json()
    res.status(200).json({ currentStep: gameData.currentStep })
  } catch (error) {
    console.error('Error fetching current step:', error)
    res.status(500).json({ currentStep: 0, error: 'Failed to fetch current step' })
  }
}
