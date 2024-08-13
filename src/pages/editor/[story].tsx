import React, { useState, useEffect } from 'react'
import { Button, Input, Textarea, FormControl, FormLabel, useToast, VStack, HStack, Box, Text } from '@chakra-ui/react'
import { useRouter } from 'next/router'
import { HeadingComponent } from '../../components/layout/HeadingComponent'

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
    paths: [0, 0],
  })
  const toast = useToast()
  const router = useRouter()
  const storyName = router.query.story as string

  useEffect(() => {
    if (storyName) {
      fetchSteps()
    }
  }, [storyName])

  const fetchSteps = async () => {
    try {
      const response = await fetch(`/api/fetchSteps?storyName=${storyName}`)
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
      const response = await fetch('/api/addStep', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ storyName, stepData: newStep }),
      })

      if (response.ok) {
        toast({
          title: 'Step added',
          description: 'New step has been added to the story',
          status: 'success',
          duration: 5000,
          isClosable: true,
        })
        fetchSteps() // Refresh the steps
        setNewStep({
          step: newStep.step + 1,
          desc: '',
          options: ['', ''],
          paths: [0, 0],
        })
      } else {
        throw new Error('Failed to add step')
      }
    } catch (error) {
      console.error('Error adding step:', error)
      toast({
        title: 'Error',
        description: 'Failed to add new step',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    }
  }

  return (
    <VStack spacing={8} align="stretch">
      <HeadingComponent as="h4">Editing {storyName}</HeadingComponent>

      <Box>
        <HeadingComponent as="h5">Existing Steps</HeadingComponent>
        {steps.map((step) => (
          <Box key={step.step} p={4} borderWidth={1} borderRadius="md" my={2}>
            <Text fontWeight="bold">Step {step.step}</Text>
            <Text>{step.desc}</Text>
            <Text fontWeight="bold">Options:</Text>
            <VStack align="stretch">
              {step.options.map((option, index) => (
                <Text key={index}>{option}</Text>
              ))}
            </VStack>
            <Text fontWeight="bold">Paths: {step.paths.join(', ')}</Text>
          </Box>
        ))}
      </Box>

      <Box>
        <HeadingComponent as="h5">Add New Step</HeadingComponent>
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

        <Button onClick={handleAddStep} colorScheme="green" mt={4}>
          Add Step
        </Button>
      </Box>
    </VStack>
  )
}
