import { NextApiRequest, NextApiResponse } from 'next'
import { API_BASE_URL } from '../../utils/api'

interface StepData {
  step: number
  desc: string
  options: string[]
  paths: number[]
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' })
  }

  try {
    const { storyName, stepData } = req.body

    if (!storyName || typeof storyName !== 'string') {
      return res.status(400).json({ error: 'Invalid story name' })
    }

    if (!validateStepData(stepData)) {
      return res.status(400).json({ error: 'Invalid step data' })
    }

    const encodedStoryName = encodeURIComponent(storyName)
    const response = await fetch(`${API_BASE_URL}/steps/${encodedStoryName}/add-step`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(stepData),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || 'Failed to add step')
    }

    res.status(201).json({ success: true })
  } catch (error) {
    console.error('Error adding step:', error)
    res.status(500).json({ error: 'Internal Server Error' })
  }
}

function validateStepData(data: any): data is StepData {
  return (
    typeof data === 'object' &&
    typeof data.step === 'number' &&
    data.step > 0 &&
    typeof data.desc === 'string' &&
    Array.isArray(data.options) &&
    data.options.every((option: any) => typeof option === 'string') &&
    Array.isArray(data.paths) &&
    data.paths.every((path: any) => typeof path === 'number' && path > 0)
  )
}
