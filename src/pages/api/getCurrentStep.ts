import type { NextApiRequest, NextApiResponse } from 'next'

type CurrentStepResponse = {
  currentStep: number
  error?: string
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<CurrentStepResponse>) {
  if (req.method !== 'GET') {
    return res.status(405).json({ currentStep: 0, error: 'Method not allowed' })
  }

  try {
    // Call your Nest.js API to get the current game state
    const response = await fetch('http://localhost:3000/games/1')
    if (!response.ok) {
      throw new Error('Failed to fetch game state')
    }

    const gameData = await response.json()
    res.status(200).json({ currentStep: gameData.currentStep })
  } catch (error) {
    console.error('Error fetching current step:', error)
    res.status(500).json({ currentStep: 0, error: 'Failed to fetch current step' })
  }
}
