import type { NextApiRequest, NextApiResponse } from 'next'
import { API_BASE_URL } from '../../utils/api'

type UpdateResponse = {
  success: boolean
  error?: string
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<UpdateResponse>) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }

  const { nextStep } = req.body
  const { token, gameId, storyName } = req.query

  if (!nextStep || typeof nextStep !== 'number') {
    return res.status(400).json({ success: false, error: 'Invalid nextStep' })
  }

  if (!token || Array.isArray(token) || !gameId || Array.isArray(gameId) || !storyName || Array.isArray(storyName)) {
    return res.status(400).json({ success: false, error: 'Invalid token, gameId or storyName' })
  }

  try {
    const updateResponse = await fetch(`${API_BASE_URL}/games/${gameId}/next-step?token=${token}&storyName=${storyName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ nextStep }),
    })

    if (!updateResponse.ok) {
      const errorData = await updateResponse.json()
      throw new Error(errorData.message || 'Failed to update game state')
    }

    res.status(200).json({ success: true })
  } catch (error) {
    console.error('Error updating game state:', error)
    res.status(500).json({ success: false, error: 'Failed to update game state' })
  }
}
