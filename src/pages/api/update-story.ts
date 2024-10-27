import type { NextApiRequest, NextApiResponse } from 'next'
import { API_BASE_URL } from '../../utils/api'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' })
  }

  try {
    const { storyName, storyData } = req.body

    if (!storyName || !storyData) {
      return res.status(400).json({ error: 'Story name and data are required' })
    }

    const response = await fetch(`${API_BASE_URL}/steps/${storyName}/update-full`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        steps: storyData,
      }),
    })

    // Read the response text first
    const responseText = await response.text()

    let responseData
    try {
      // Try to parse it as JSON if it's not empty
      responseData = responseText ? JSON.parse(responseText) : {}
    } catch (e) {
      console.error('Failed to parse response:', responseText)
      throw new Error('Invalid response from server')
    }

    if (!response.ok) {
      throw new Error(responseData.message || responseData.error || 'Failed to update story')
    }

    return res.status(200).json({ success: true, data: responseData })
  } catch (error) {
    console.error('Error in update-story API route:', error)
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to update story',
      details: error instanceof Error ? error.stack : undefined,
    })
  }
}
