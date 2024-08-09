import type { NextApiRequest, NextApiResponse } from 'next'
import { API_BASE_URL } from '../../utils/api'

// type UpdateResponse = {
//   success: boolean
//   error?: string
// }

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }

  const { userName } = req.body

  if (!userName || typeof userName !== 'string') {
    return res.status(400).json({ success: false, error: 'Invalid user name' })
  }

  console.log('user name:', userName)

  const body = {
    story: 'The Jade Island',
    currentStep: 1,
    players: {
      totalNumber: 1,
      list: [
        {
          name: userName,
          age: 42,
          force: 42,
          intelligence: 42,
        },
      ],
    },
  }

  try {
    const response = await fetch(`${API_BASE_URL}/games`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ body }),
    })

    if (!response.ok) {
      throw new Error('Failed to start game from API route')
    }

    res.status(200).json({ success: true })
  } catch (error) {
    console.error('Error starting game:', error)
    res.status(500).json({ success: false, error: 'Failed to start game' })
  }
}
