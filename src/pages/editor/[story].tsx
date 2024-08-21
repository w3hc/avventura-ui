import React, { useState, useEffect } from 'react'
import { Button, Input, Textarea, FormControl, FormLabel, useToast, VStack, HStack, Box, Text } from '@chakra-ui/react'
import { useRouter } from 'next/router'
import { HeadingComponent } from '../../components/layout/HeadingComponent'
import { FaPlus } from 'react-icons/fa'

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
  const toast = useToast()
  const router = useRouter()
  const storyName = router.query.story as string

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
        setNewStep((prev) => ({ ...prev, step: data.length + 1 }))
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

  const handleAddStep = async () => {
    try {
      // Validate input
      if (!newStep.desc || newStep.options.some((option) => !option) || newStep.paths.some((path) => path === 0)) {
        toast({
          title: 'Invalid input',
          description: 'Please fill in all fields',
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
          title: 'Step added',
          description: 'New step has been added to the story',
          status: 'success',
          duration: 5000,
          isClosable: true,
        })
        // Refresh the steps after adding a new one
        await fetchAllSteps()
      } else {
        throw new Error('Failed to add step')
      }
    } catch (error) {
      console.error('Error adding step:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to add new step',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    }
  }

  useEffect(() => {
    if (storyName) {
      fetchAllSteps()
    }
  }, [storyName, handleAddStep])

  return (
    <VStack spacing={8} align="stretch">
      <HeadingComponent as="h3">Editing {storyName}</HeadingComponent>

      <Box>
        {steps.map((step) => (
          <Box key={step.step} p={4} borderWidth={1} borderRadius="lg" my={2}>
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

      <Box>
        <HeadingComponent as="h3">Add New Step</HeadingComponent>
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
                  newPaths[index] = parseInt(e.target.value)
                  setNewStep({ ...newStep, paths: newPaths })
                }}
                placeholder={`Path ${index + 1}`}
              />
            ))}
          </HStack>
        </FormControl>
        <br />
        <Button onClick={handleAddStep} colorScheme="blue" mt={4} rightIcon={<FaPlus />}>
          Add Step
        </Button>
      </Box>
      <br />
      <br />
    </VStack>
  )
}
