import React, { useState, useEffect, useRef } from 'react'
import { Button, Input, Textarea, FormControl, FormLabel, useToast, VStack, HStack, Box, Text, Divider, useClipboard } from '@chakra-ui/react'
import { useRouter } from 'next/router'
import { HeadingComponent } from '../../components/layout/HeadingComponent'
import { FaPlus, FaFileImport } from 'react-icons/fa'
import { FaCopy } from 'react-icons/fa'
import { LinkComponent } from '../../components/layout/LinkComponent'

interface StoryStep {
  step: number
  desc: string
  options: string[]
  paths: number[]
}

export default function Editor() {
  const [steps, setSteps] = useState<StoryStep[]>([])
  const [newStep, setNewStep] = useState<StoryStep>({
    step: 1,
    desc: '',
    options: ['', ''],
    paths: [1, 1],
  })
  const [importJson, setImportJson] = useState('')
  const [isImporting, setIsImporting] = useState(false)
  const toast = useToast()
  const router = useRouter()
  const storyName = router.query.story as string
  const editSectionRef = useRef<HTMLDivElement>(null)

  const storyJson = JSON.stringify(steps, null, 2)
  const { onCopy, hasCopied } = useClipboard(storyJson)

  const fetchAllSteps = async () => {
    try {
      if (!storyName) {
        throw new Error('Story name is not available')
      }
      const encodedStoryName = encodeURIComponent(storyName)
      const response = await fetch(`/api/fetchAllSteps?storyName=${encodedStoryName}`)
      if (response.ok) {
        const data = await response.json()
        setSteps(data)
      } else {
        throw new Error('Failed to fetch steps')
      }
    } catch (error) {
      console.error('Error fetching steps:', error)
      toast({
        title: 'Error',
        description: 'Failed to load story steps',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    }
  }

  const suggestNewPaths = (existingSteps: StoryStep[], currentStep: number): number[] => {
    const existingStepNumbers = existingSteps.map((step) => step.step)
    let suggestedPath1 = currentStep + 1
    let suggestedPath2 = suggestedPath1 + 1

    while (existingStepNumbers.includes(suggestedPath1)) {
      suggestedPath1++
    }
    while (existingStepNumbers.includes(suggestedPath2) || suggestedPath2 === suggestedPath1) {
      suggestedPath2++
    }

    return [suggestedPath1, suggestedPath2]
  }

  const fetchStepData = (stepNumber: number) => {
    const existingStep = steps.find((step) => step.step === stepNumber)
    if (existingStep) {
      setNewStep({
        ...existingStep,
        paths: suggestNewPaths(steps, stepNumber),
      })
    } else {
      setNewStep({
        step: stepNumber,
        desc: '',
        options: ['', ''],
        paths: suggestNewPaths(steps, stepNumber),
      })
    }
  }

  const smoothScrollToRef = (ref: React.RefObject<HTMLElement>) => {
    if (!ref.current) return

    const startPosition = window.pageYOffset
    const targetPosition = ref.current.getBoundingClientRect().top + window.pageYOffset
    const distance = targetPosition - startPosition
    const duration = 1000 // Animation duration in milliseconds
    let start: number | null = null

    const easeOutCubic = (t: number): number => {
      return 1 - Math.pow(1 - t, 3)
    }

    const animation = (currentTime: number) => {
      if (start === null) start = currentTime
      const timeElapsed = currentTime - start
      const progress = Math.min(timeElapsed / duration, 1)

      const easedProgress = easeOutCubic(progress)

      window.scrollTo(0, startPosition + distance * easedProgress)

      if (timeElapsed < duration) {
        requestAnimationFrame(animation)
      }
    }

    requestAnimationFrame(animation)
  }

  const handleCardClick = (step: StoryStep) => {
    setNewStep({
      ...step,
      paths: suggestNewPaths(steps, step.step),
    })

    // Use custom smooth scroll
    smoothScrollToRef(editSectionRef)

    // Add a subtle highlight effect to the edit section
    if (editSectionRef.current) {
      editSectionRef.current.style.transition = 'background-color 0.5s ease'
      editSectionRef.current.style.backgroundColor = 'rgba(66, 153, 225, 0.1)' // Light blue highlight

      // Remove highlight after animation
      setTimeout(() => {
        if (editSectionRef.current) {
          editSectionRef.current.style.backgroundColor = 'transparent'
        }
      }, 1500)
    }
  }

  const handleAddStep = async () => {
    try {
      // Validate input
      if (!newStep.step || !newStep.desc || newStep.options.some((option) => !option) || newStep.paths.some((path) => path === 0 || isNaN(path))) {
        toast({
          title: 'Invalid input',
          description: 'Please fill in all fields with valid values',
          status: 'error',
          duration: 5000,
          isClosable: true,
        })
        return
      }

      if (!storyName) {
        throw new Error('Story name is not available')
      }

      const response = await fetch('/api/addStep', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ storyName, stepData: newStep }),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: 'Step updated',
          description: 'Step has been added or updated in the story',
          status: 'success',
          duration: 5000,
          isClosable: true,
        })
        await fetchAllSteps()
        const nextStepNumber = Math.max(...steps.map((step) => step.step), newStep.step) + 1
        const suggestedPaths = suggestNewPaths(steps, nextStepNumber)
        setNewStep({
          step: nextStepNumber,
          desc: '',
          options: ['', ''],
          paths: suggestedPaths,
        })
      } else {
        throw new Error('Failed to add/update step')
      }
    } catch (error) {
      console.error('Error adding/updating step:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to add/update step',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    }
  }

  const handleCopyToClipboard = () => {
    onCopy()
    toast({
      title: 'Story Copied',
      description: 'The story has been copied to the clipboard.',
      status: 'success',
      duration: 3000,
      isClosable: true,
    })
  }

  const handleImportStory = async () => {
    if (!importJson.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter the story JSON',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
      return
    }

    setIsImporting(true)
    try {
      // Try to parse the JSON first
      let storyData: StoryStep[]
      try {
        // Clean the input JSON
        const cleanJson = importJson.trim()
        storyData = JSON.parse(cleanJson)
      } catch (error) {
        console.error('JSON parsing error:', error)
        toast({
          title: 'Invalid JSON',
          description: 'Please ensure the story data is valid JSON',
          status: 'error',
          duration: 5000,
          isClosable: true,
        })
        return
      }

      // Validate story structure
      if (!Array.isArray(storyData)) {
        toast({
          title: 'Invalid Format',
          description: 'Story data must be an array of steps',
          status: 'error',
          duration: 5000,
          isClosable: true,
        })
        return
      }

      const response = await fetch(`/api/update-story`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          storyName,
          storyData,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update story')
      }

      toast({
        title: 'Success',
        description: 'Story updated successfully',
        status: 'success',
        duration: 5000,
        isClosable: true,
      })

      // Clear the input and refresh the display
      setImportJson('')
      await fetchAllSteps()
    } catch (error) {
      console.error('Error importing story:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to import story',
        status: 'error',
        duration: 9000,
        isClosable: true,
      })
    } finally {
      setIsImporting(false)
    }
  }

  useEffect(() => {
    if (storyName) {
      fetchAllSteps()
    }
  }, [storyName])

  return (
    <VStack spacing={8} align="stretch">
      <Box>
        <HeadingComponent as="h3">Editing {storyName}</HeadingComponent>
        <VStack align="start" spacing={2} mt={6} mb={3}>
          <Text>
            Story public URL:{' '}
            <LinkComponent href={`https://avventura.fun/${storyName}`} isExternal>
              https://avventura.fun/{storyName}
            </LinkComponent>
          </Text>
          <Text>
            Editor:{' '}
            <LinkComponent href={`https://avventura.fun/editor/${storyName}`} isExternal>
              https://avventura.fun/editor/{storyName}
            </LinkComponent>
          </Text>
        </VStack>
      </Box>

      <Box>
        {steps.map((step) => (
          <Box
            key={step.step}
            p={4}
            borderWidth={1}
            borderRadius="lg"
            my={2}
            onClick={() => handleCardClick(step)}
            cursor="pointer"
            _hover={{
              borderColor: 'blue.500',
              boxShadow: 'md',
              transform: 'translateY(-2px)',
            }}
            transition="all 0.2s">
            <Text fontWeight="bold">Step {step.step}</Text>
            <Text>{step.desc}</Text>
            <br />
            <Text fontWeight="bold">Options:</Text>
            <VStack align="stretch">
              {step.options.map((option, index) => (
                <Text key={index}>{option}</Text>
              ))}
            </VStack>
            <br />
            <Text>
              Paths: <strong>{step.paths.join(', ')}</strong>
            </Text>
          </Box>
        ))}
      </Box>

      <Box ref={editSectionRef} transition="background-color 0.5s ease" borderRadius="lg" p={6}>
        <HeadingComponent as="h3">Edit Step</HeadingComponent>
        <br />
        <FormControl>
          <FormLabel>Step</FormLabel>
          <Input
            type="number"
            value={newStep.step}
            onChange={(e) => {
              const stepNumber = parseInt(e.target.value, 10)
              fetchStepData(stepNumber)
            }}
            placeholder="Enter step number"
          />
        </FormControl>

        <br />
        <FormControl>
          <FormLabel>Description</FormLabel>
          <Textarea value={newStep.desc} onChange={(e) => setNewStep({ ...newStep, desc: e.target.value })} placeholder="Enter step description" />
        </FormControl>

        <FormControl mt={4}>
          <FormLabel>Options</FormLabel>
          {newStep.options.map((option, index) => (
            <Input
              key={index}
              value={option}
              onChange={(e) => {
                const newOptions = [...newStep.options]
                newOptions[index] = e.target.value
                setNewStep({ ...newStep, options: newOptions })
              }}
              placeholder={`Option ${index + 1}`}
              mt={2}
            />
          ))}
        </FormControl>

        <FormControl mt={4}>
          <FormLabel>Paths</FormLabel>
          <HStack>
            {newStep.paths.map((path, index) => (
              <Input
                key={index}
                type="number"
                value={path}
                onChange={(e) => {
                  const newPaths = [...newStep.paths]
                  newPaths[index] = parseInt(e.target.value, 10) || 0
                  setNewStep({ ...newStep, paths: newPaths })
                }}
                placeholder={`Path ${index + 1}`}
              />
            ))}
          </HStack>
        </FormControl>
        <br />
        <Button onClick={handleCopyToClipboard} leftIcon={<FaCopy />} colorScheme="teal">
          {hasCopied ? 'Copied!' : 'Copy Story to Clipboard'}
        </Button>
        <br />
        <Button onClick={handleAddStep} colorScheme="blue" mt={4} rightIcon={<FaPlus />}>
          Add/Update Step
        </Button>
      </Box>

      <Divider my={8} />

      <Box>
        <HeadingComponent as="h3">Import Story</HeadingComponent>
        <Text color="gray.500" mb={4}>
          Paste the complete story JSON below to update the entire story structure. This will overwrite the existing story.
        </Text>
        <FormControl>
          <FormLabel>Story JSON</FormLabel>
          <Textarea
            value={importJson}
            onChange={(e) => setImportJson(e.target.value)}
            placeholder="Paste your story JSON here..."
            height="200px"
            mb={4}
          />
          <Button onClick={handleImportStory} colorScheme="purple" isLoading={isImporting} loadingText="Importing..." leftIcon={<FaFileImport />}>
            Import Story
          </Button>
        </FormControl>
      </Box>
      <br />
      <br />
    </VStack>
  )
}
