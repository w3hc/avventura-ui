import type { NextApiRequest, NextApiResponse } from 'next'
import { API_BASE_URL } from '../../utils/api'

type Story = {
  name: string
  slug: string
  description: string
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<Story[] | { error: string }>) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const response = await fetch(`${API_BASE_URL}/steps/stories`)

    if (!response.ok) {
      throw new Error('Failed to fetch stories')
    }

    const stories: Story[] = await response.json()
    res.status(200).json(stories)
  } catch (error) {
    console.error('Error fetching stories:', error)
    res.status(500).json({ error: 'Failed to fetch stories' })
  }
}
