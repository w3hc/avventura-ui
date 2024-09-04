import type { NextApiRequest, NextApiResponse } from 'next'
import { API_BASE_URL } from '../../utils/api'

type StoryCard = {
  step: number
  desc: string
  options: string[]
  paths: number[]
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<StoryCard | { error: string }>) {
  const { id } = req.query

  if (!id || Array.isArray(id)) {
    return res.status(400).json({ error: 'Invalid id parameter' })
  }

  try {
    const response = await fetch(`${API_BASE_URL}/steps/single/${id}`)
    if (!response.ok) {
      throw new Error('Failed to fetch story card')
    }
    const data: StoryCard = await response.json()
    res.status(200).json(data)
  } catch (error) {
    console.error('Error fetching story card:', error)
    res.status(500).json({ error: 'Failed to fetch story card' })
  }
}
