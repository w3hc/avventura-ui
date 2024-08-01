import type { NextApiRequest, NextApiResponse } from 'next'

type UpdateResponse = {
  success: boolean
  error?: string
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<UpdateResponse>) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }

  const { nextStep } = req.body

  if (!nextStep || typeof nextStep !== 'number') {
    return res.status(400).json({ success: false, error: 'Invalid nextStep' })
  }

  console.log('next step:', nextStep)
  try {
    const response = await fetch('http://localhost:3000/games/1/next-step', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ nextStep }),
    })

    if (!response.ok) {
      throw new Error('Failed to update game state from API route')
    }

    res.status(200).json({ success: true })
  } catch (error) {
    console.error('Error updating game state:', error)
    res.status(500).json({ success: false, error: 'Failed to update game state' })
  }
}
