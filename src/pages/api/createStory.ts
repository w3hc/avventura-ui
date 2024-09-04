import { NextApiRequest, NextApiResponse } from 'next'
import { API_BASE_URL } from '../../utils/api'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' })
  }

  try {
    const { name } = req.body

    if (!name || typeof name !== 'string') {
      return res.status(400).json({ error: 'Invalid story name' })
    }

    // Make a request to your NestJS backend
    const response = await fetch(`${API_BASE_URL}/steps/create-story`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || 'Failed to create story')
    }

    // Assuming the story was created successfully
    const storyName = name.toLowerCase().replace(/\s+/g, '-')

    res.status(201).json({ success: true, storyName })
  } catch (error) {
    console.error('Error creating story:', error)
    res.status(500).json({ error: 'Internal Server Error' })
  }
}
