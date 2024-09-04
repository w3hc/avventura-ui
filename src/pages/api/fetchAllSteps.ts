import type { NextApiRequest, NextApiResponse } from 'next'
import { API_BASE_URL } from '../../utils/api'

type StoryStep = {
  step: number
  desc: string
  options: string[]
  paths: number[]
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<StoryStep[] | { error: string }>) {
  const { storyName } = req.query

  if (!storyName || Array.isArray(storyName)) {
    return res.status(400).json({ error: 'Invalid storyName parameter' })
  }

  try {
    const encodedStoryName = encodeURIComponent(storyName)
    const response = await fetch(`${API_BASE_URL}/steps/story/${encodedStoryName}`)
    if (!response.ok) {
      throw new Error('Failed to fetch story steps')
    }
    const data: StoryStep[] = await response.json()
    res.status(200).json(data)
  } catch (error) {
    console.error('Error fetching story steps:', error)
    res.status(500).json({ error: 'Failed to fetch story steps' })
  }
}
