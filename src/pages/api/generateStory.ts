import type { NextApiRequest, NextApiResponse } from 'next'

const defaultPrompt = `This is a text-based RPG game.
The "story" is the decision tree (in JSON format).
The generated output should be only a JSON file: no other content AT ALL, no comments or explanations or anything else than the JSON artifact.
Make sure there are a total of 5 levels in the story. Write again the whole story. No comments or explanations in the output. 

STRUCTURE:
- Each step must have the following fields exactly:
  - step (number): unique identifier
  - desc (string): the description/text for this step
  - options (string[]): array of choices
  - paths (number[]): array of next step numbers
- The word "level" designates the layers or tiers in the decision tree.
- Steps in the same level are at the same depth in the tree.
- make sure that the JSON content is: []

OPTIONS & PATHS:
- For regular steps: There must be 2 or 3 options
- For story endings: There must be exactly 1 option
- The "paths" array links to the next possible steps by their numbers
- IMPORTANT: Each path number in the "paths" array MUST correspond to an existing step number
- If a path number refers to a non-existent step, it MUST be changed to 1 (return to start)

STORY ENDINGS:
- A "story ending" is a terminal node (a step with no further branches)
- When a step is a story ending, its paths array must contain exactly [1] to loop back to start`

async function generateStoryWithClaude(prompt: string, basePrompt: string) {
  console.log('Generating story with prompt:', prompt)

  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY is not configured')
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-api-key': process.env.ANTHROPIC_API_KEY as string,
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
          content: `${basePrompt}\n\nCreate a story about: ${prompt}\n\nReminder: Output ONLY the JSON array. No other text.`,
        },
      ],
    }),
  })

  console.log('Claude API response status:', response.status)
  const responseText = await response.text()
  console.log('Claude API raw response:', responseText)

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
    const rawStoryData = JSON.parse(jsonContent)

    // Transform the data to match Avventura API format
    const storyData = rawStoryData.map((step: any) => ({
      step: step.step,
      desc: step.story || step.desc,
      options: step.options,
      paths: step.paths,
    }))

    console.log('Transformed story data:', JSON.stringify(storyData, null, 2))
    return storyData
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
    const { prompt, storyName, depth = 5 } = req.body // Add depth with default value
    console.log('Received request:', { prompt, storyName, depth })

    if (!prompt || !storyName) {
      return res.status(400).json({ error: 'Prompt and story name are required' })
    }

    // Replace {depth} in the prompt with the actual depth value
    const finalPrompt = defaultPrompt.replace('{depth}', depth.toString())

    // Generate story using Claude with the modified prompt
    const storyData = await generateStoryWithClaude(prompt, finalPrompt)

    console.log('Calling Avventura API with story data')
    const requestBody = { steps: storyData }
    console.log('Full request body:', JSON.stringify(requestBody, null, 2))
    // const apiUrl = 'https://avventura.jcloud-ver-jpe.ik-server.com'
    const apiUrl = process.env.API_BASE_URL
    console.log('Using API URL:', apiUrl)
    const updateResponse = await fetch(`${apiUrl}/steps/${storyName}/update-full`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        steps: storyData,
      }),
    })

    // Read the response text first
    const responseText = await updateResponse.text()
    console.log('Avventura API response:', responseText)

    let responseData
    try {
      // Try to parse it as JSON if it's not empty
      responseData = responseText ? JSON.parse(responseText) : {}
    } catch (e) {
      console.error('Failed to parse Avventura API response:', responseText)
      throw new Error('Invalid response from Avventura API')
    }

    if (!updateResponse.ok) {
      throw new Error(responseData.message || responseData.error || 'Failed to update story')
    }

    return res.status(200).json({ success: true, data: responseData })
  } catch (error) {
    console.error('Error in generateStory API route:', error)
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to generate story',
      details: error instanceof Error ? error.stack : undefined,
    })
  }
}
