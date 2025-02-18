import type { NextApiRequest, NextApiResponse } from 'next'
import { API_BASE_URL } from '../../utils/api'

interface StoryStep {
  step: number
  desc: string
  options: string[]
  paths: number[]
}

interface GeneratedStep {
  step: number
  desc: string
  options: string[]
  paths: number[]
  story?: string
}

async function addStepToStory(storyName: string, stepData: StoryStep): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/steps/${storyName}/add-step`, {
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

    return true
  } catch (error) {
    console.error(`Error adding step ${stepData.step}:`, error)
    return false
  }
}

async function addGeneratedSteps(storyName: string, steps: GeneratedStep[]): Promise<{ success: boolean; addedSteps: number }> {
  let addedSteps = 0

  // Process steps sequentially
  for (const step of steps) {
    // Skip invalid steps
    if (!step.desc || !step.options || !step.paths || step.step === 0) {
      console.log(`Skipping invalid step ${step.step}:`, step)
      continue
    }

    // Format step data
    const stepData: StoryStep = {
      step: step.step,
      desc: step.desc,
      options: step.options,
      paths: step.paths,
    }

    // Add step to story
    const success = await addStepToStory(storyName, stepData)
    if (success) {
      addedSteps++
      console.log(`Successfully added step ${step.step}`)
    } else {
      console.error(`Failed to add step ${step.step}`)
    }
  }

  return {
    success: addedSteps > 0,
    addedSteps,
  }
}

async function generateStoryWithClaude(
  initialStep: StoryStep,
  existingSteps: StoryStep[],
  storyPrompt: string,
  depth: number
): Promise<GeneratedStep[]> {
  console.log('Generating story with initial step:', initialStep)
  console.log('Using story prompt:', storyPrompt)

  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY is not configured')
  }

  const completePrompt = `This is a text-based RPG game.
    The "story" is the decision tree (in JSON format).
    The generated output should be only a JSON file: no other content AT ALL, no comments or explanations or anything else than the JSON artifact.
    Make sure there are a total of 5 levels in the story. Write again the whole story. No comments or explanations in the output. 
    Always use the language used in the prompt.

    STRUCTURE:
    - The term "step" designates a card in the story. Each step has a unique number.
    - The word "level" designates the layers or tiers in the decision tree.
    - Steps in the same level are at the same depth in the tree.
    - make sure that the JSOn content is: []

    OPTIONS & PATHS:
    - For regular steps: There must be 2 or 3 options
    - For story endings: There must be exactly 1 option
    - The "paths" array links to the next possible steps by their numbers
    - IMPORTANT: Each path number in the "paths" array MUST correspond to an existing step number
    - If a path number refers to a non-existent step, it MUST be changed to 1 (return to start)

    STORY ENDINGS:
    - A "story ending" is a terminal node (a step with no further branches)
    - When a step is a story ending, its paths array must contain exactly [1] to loop back to start

    Example of a regular step:
    {
        "step": 2,
        "desc": "You enter the cave...",
        "options": [
            "Go deeper",
            "Turn back"
        ],
        "paths": [
            3,
            4
        ]
    }

    Example of a story ending:
    {
        "step": 5,
        "desc": "You found the treasure!",
        "options": [
            "You have won! Congrats!"
        ],
        "paths": [
            1
        ]
    }
    
    This is the existing story so far: 

    ${existingSteps.map((step) => step.desc).join('\n\n')}

    IMPORTANT: Extend the sory (${depth} levels) starting from step ${initialStep.step}. Don't forget to edit ${initialStep.step} too. 

    This new part of the story must nicely include this : 

    ${storyPrompt}

    `

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-api-key': process.env.ANTHROPIC_API_KEY,
    'anthropic-version': '2023-06-01',
  }

  console.log('Making request to Claude API...')
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model: 'claude-3-sonnet-20240229',
      max_tokens: 4000,
      messages: [
        {
          role: 'user',
          content: completePrompt,
        },
      ],
    }),
  })

  console.log('Claude API response status:', response.status)
  const responseText = await response.text()
  // console.log('Claude API raw response:', responseText)

  if (!response.ok) {
    throw new Error(`Failed to generate story with Claude: ${responseText}`)
  }

  let data
  try {
    data = JSON.parse(responseText)
  } catch (error) {
    console.error('Failed to parse Claude response:', responseText)
    throw new Error('Invalid JSON response from Claude')
  }

  try {
    // Extract just the JSON content from Claude's response
    let jsonContent = data.content[0].text
    console.log('Extracted content:', jsonContent)

    // If the response starts with ```json, remove that and the closing ```
    if (jsonContent.includes('```json')) {
      jsonContent = jsonContent.split('```json')[1].split('```')[0].trim()
    } else if (jsonContent.includes('```')) {
      jsonContent = jsonContent.split('```')[1].split('```')[0].trim()
    }

    // Parse the JSON to validate it
    const generatedSteps = JSON.parse(jsonContent) as GeneratedStep[]

    // Filter out any invalid steps
    const validSteps = generatedSteps.filter(
      (step) => step.desc && step.options && step.paths && !existingSteps.some((existing) => existing.step === step.step)
    )

    console.log('Valid generated steps:', JSON.stringify(validSteps, null, 2))
    return validSteps
  } catch (error) {
    console.error('Error parsing story data:', error)
    throw new Error('Invalid story data format from Claude')
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' })
  }

  try {
    const { prompt, storyName, depth = 5, selectedStep } = req.body
    console.log('Received request:', { prompt, storyName, depth, selectedStep })

    if (!prompt || !storyName || !selectedStep) {
      return res.status(400).json({ error: 'Prompt, story name, and selectedStep are required' })
    }

    // Validate depth
    const parsedDepth = parseInt(String(depth), 10)
    if (isNaN(parsedDepth) || parsedDepth < 1) {
      return res.status(400).json({ error: 'Invalid depth parameter. Must be a positive number.' })
    }

    // Fetch existing steps
    const existingSteps = await fetchExistingSteps(storyName)
    console.log('Fetched existing steps:', existingSteps)

    // Generate story using Claude
    const generatedSteps = await generateStoryWithClaude(selectedStep, existingSteps, prompt, parsedDepth)

    // Add generated steps one by one
    const result = await addGeneratedSteps(storyName, generatedSteps)

    return res.status(200).json({
      success: result.success,
      message: `Successfully added ${result.addedSteps} new steps`,
      addedSteps: result.addedSteps,
    })
  } catch (error) {
    console.error('Error in generateStoryFromStep API route:', error)
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to generate story',
      details: error instanceof Error ? error.stack : undefined,
    })
  }
}

async function fetchExistingSteps(storyName: string): Promise<StoryStep[]> {
  console.log('Fetching existing steps for story:', storyName)
  const encodedStoryName = encodeURIComponent(storyName)
  const response = await fetch(`${API_BASE_URL}/steps/story/${encodedStoryName}`)

  if (!response.ok) {
    throw new Error('Failed to fetch existing story steps')
  }

  const data: StoryStep[] = await response.json()
  console.log('Fetched existing steps:', data)
  return data
}
