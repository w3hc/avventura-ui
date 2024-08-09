import React, { ReactNode, useState, useEffect, useCallback } from 'react'
import { Text, Button, useToast, Box, VStack, Flex } from '@chakra-ui/react'
import { useRouter } from 'next/router'
import { HeadingComponent } from '../../components/layout/HeadingComponent'
import { LinkComponent } from '../../components/layout/LinkComponent'
import Image from 'next/image'
import styled from '@emotion/styled'

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

const TypingText = styled.div`
  white-space: pre-wrap;
  overflow: hidden;
  border-right: 0px solid;
`

interface TypingEffectProps {
  text: string
  speed?: number
  onComplete: () => void
}

const TypingEffect: React.FC<TypingEffectProps> = ({ text, speed = 10, onComplete }) => {
  const [displayedText, setDisplayedText] = useState('')

  useEffect(() => {
    setDisplayedText('') // Reset text when input changes
    let i = 0
    const typingInterval = setInterval(() => {
      if (i < text.length) {
        setDisplayedText(text.slice(0, i + 1))
        i++
      } else {
        clearInterval(typingInterval)
        onComplete()
      }
    }, speed)

    return () => clearInterval(typingInterval)
  }, [text, speed, onComplete])

  return <TypingText>{displayedText}</TypingText>
}

export default function Play() {
  const router = useRouter()
  const toast = useToast()

  const [currentStep, setCurrentStep] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [story, setStory] = useState<StoryCard | null>(null)
  const [showOptions, setShowOptions] = useState<boolean>(false)
  const [sessionToken, setSessionToken] = useState<string>('defaultSessionToken')

  // const login = async () => {
  //   try {
  //     setIsLoading(true)
  //     // trigger Web3 modal
  //     // setSessionToken
  //   } catch (error) {
  //     console.error("Can't login")
  //     toast({
  //       title: 'Woops',
  //       description: "Can't login",
  //       status: 'error',
  //       duration: 9000,
  //       isClosable: true,
  //     })
  //   } finally {
  //     setIsLoading(false)
  //   }
  // }

  const checkTokenSession = async () => {
    try {
      setIsLoading(true)
      // call
    } catch (error) {
      console.error('create game')
      toast({
        title: 'Woops',
        description: "Can't start game",
        status: 'error',
        duration: 9000,
        isClosable: true,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const fetchInitialStep = async (sessionToken: string) => {
    try {
      const response = await fetch(`/api/getCurrentStep?session=${sessionToken}`)
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
    setShowOptions(false)
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
    setShowOptions(false)
    try {
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

      setCurrentStep(choice)
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
    }
  }

  useEffect(() => {
    // TODO: get sessionToken from local storage

    if (sessionToken) {
      fetchInitialStep(sessionToken)
    } else {
      router.push('/')
    }
  }, [])

  const handleTypingComplete = useCallback(() => {
    console.log('Typing complete, setting timeout for options')
    setTimeout(() => {
      console.log('Timeout complete, showing options')
      setShowOptions(true)
    }, 500) // Delay
  }, [])

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center">
        <Image priority width="200" height="200" alt="loader" src="/loader.svg" />
      </Box>
    )
  }

  if (!story || currentStep === null) {
    return <div>No story found</div>
  }

  return (
    <Flex flexDirection="column" height="100vh" padding={4}>
      <VStack spacing={4} flex={1} width="100%">
        <Box width="100%" maxHeight="180px" overflowY="auto" marginBottom={4} marginTop={10}>
          <HeadingComponent as="h4">
            <TypingEffect text={story.desc} onComplete={handleTypingComplete} />
          </HeadingComponent>
        </Box>
        {showOptions && (
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
                <Text fontSize="lg" fontWeight="medium" color={'#45a2f8'} _hover={{ color: '#45a2f8' }}>
                  {option}
                </Text>
              </Box>
            ))}
          </VStack>
        )}
      </VStack>
    </Flex>
  )
}
