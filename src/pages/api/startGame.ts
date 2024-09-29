import type { NextApiRequest, NextApiResponse } from 'next'
import { API_BASE_URL } from '../../utils/api'

type NestJsApiResponse = {
  id: number
  story: string
  currentStep: number
  players: {
    totalNumber: number
    list: Array<{
      name: string
      age: number
      force: number
      intelligence: number
    }>
  }
  token: string
}

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
    story: 'Optimistic Life',
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
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      throw new Error('Failed to start game from API route')
    }

    const nestJsApiResponse: NestJsApiResponse = await response.json()

    res.status(200).json({
      success: true,
      game: nestJsApiResponse,
    })
  } catch (error) {
    console.error('Error starting game:', error)
    res.status(500).json({ success: false, error: 'Failed to start game' })
  }
}
