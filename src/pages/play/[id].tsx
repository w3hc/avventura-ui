import React, { ReactNode } from 'react'
import { Text, Button, useToast, Box, VStack, Flex } from '@chakra-ui/react'
import { useRouter } from 'next/router'
import { HeadingComponent } from '../../components/layout/HeadingComponent'
import { LinkComponent } from '../../components/layout/LinkComponent'
import { useState, useEffect } from 'react'

interface Props {
  href: string
  children: ReactNode
  isExternal?: boolean
  className?: string
  onClick?: () => void
}

interface StoryCard {
  step: number
  desc: string
  options: string[]
  paths: number[]
}

export default function Play() {
  const router = useRouter()
  const toast = useToast()

  const [currentStep, setCurrentStep] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [story, setStory] = useState<StoryCard | null>(null)

  const fetchInitialStep = async () => {
    try {
      const response = await fetch('/api/getCurrentStep')
      if (!response.ok) {
        throw new Error('Failed to fetch current step')
      }
      const data = await response.json()
      setCurrentStep(data.currentStep)
      console.log('current step:', data.currentStep)
      await fetchCard(data.currentStep)
    } catch (error) {
      console.error('Error fetching initial step:', error)
      toast({
        title: 'Error',
        description: 'Failed to start the game',
        status: 'error',
        duration: 9000,
        isClosable: true,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const fetchCard = async (step: number) => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/fetchCard?id=${step}`)
      if (!response.ok) {
        throw new Error('Failed to fetch story card')
      }
      const data = await response.json()
      console.log('card:', data)
      setStory(data)
    } catch (error) {
      console.error('Error fetching story card:', error)
      toast({
        title: 'Error',
        description: 'Failed to fetch story card',
        status: 'error',
        duration: 9000,
        isClosable: true,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const nextStep = async (choice: number) => {
    console.log('next step:', choice)
    setIsLoading(true)
    try {
      // Update the game state
      const updateResponse = await fetch('/api/updateGameStep', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ nextStep: choice }),
      })

      if (!updateResponse.ok) {
        throw new Error('Failed to update game state')
      }

      // Update the current step
      setCurrentStep(choice)

      // Fetch the new story card
      await fetchCard(choice)
    } catch (error) {
      console.error('Error advancing to next step:', error)
      toast({
        title: 'Error',
        description: 'Failed to advance to the next step',
        status: 'error',
        duration: 9000,
        isClosable: true,
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchInitialStep()
  }, [])

  if (isLoading) {
    return <div> </div>
  }

  if (!story || currentStep === null) {
    return <div>No story found</div>
  }

  return (
    <Flex flexDirection="column" height="100vh" padding={4}>
      <VStack spacing={4} flex={1} width="100%">
        <Box
          width="100%"
          height="100px" // Adjust this value as needed for 5 lines
          overflowY="auto"
          marginBottom={4}>
          <HeadingComponent as="h4">{story.desc}</HeadingComponent>
        </Box>
        <VStack spacing={4} width="100%">
          {story.options.map((option, index) => (
            <Box
              key={index}
              width="100%"
              borderRadius="lg"
              p={4}
              borderWidth="2px"
              onClick={() => nextStep(story.paths[index])}
              cursor="pointer"
              _hover={{
                borderColor: '#8c1c84',
                boxShadow: 'md',
              }}
              transition="all 0.2s">
              <Text fontSize="xl" fontWeight="medium" color={'#45a2f8'} _hover={{ color: '#45a2f8' }}>
                {option}
              </Text>
            </Box>
          ))}
        </VStack>
      </VStack>
    </Flex>
  )
}
