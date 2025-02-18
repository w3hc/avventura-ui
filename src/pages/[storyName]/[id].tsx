import React, { ReactNode, useState, useEffect, useCallback } from 'react'
import { Text, Button, useToast, Box, VStack, Flex, Link } from '@chakra-ui/react'
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

/**
 *
 * Main logic
 *
 * (1) We check if the user has a valid session token. If not, we redirect them to the homepage.
 * (2) We fetch the current step (initial step) of the game using the session token.
 * (3) We fetch the story card for the current step.
 *
 */

const TypingEffect: React.FC<TypingEffectProps> = ({ text, speed = 10, onComplete }) => {
  const [displayedText, setDisplayedText] = useState('')

  useEffect(() => {
    setDisplayedText('')
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

  const { storyName, id } = router.query

  const [currentStep, setCurrentStep] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [story, setStory] = useState<StoryCard | null>(null)
  const [showOptions, setShowOptions] = useState<boolean>(false)
  const [sessionToken, setSessionToken] = useState<string>('')

  const fetchInitialStep = async (sessionToken: string) => {
    try {
      const response = await fetch(`/api/getCurrentStep?sessionToken=${sessionToken}&storyName=${storyName}`)
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
        description: 'Failed to fetch initial step',
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
      const response = await fetch(`/api/fetchCard?id=${step}&storyName=${storyName}`)
      if (!response.ok) {
        throw new Error('Failed to fetch story card')
      }
      const data = await response.json()
      console.log('card:', data)
      setStory(data)
    } catch (error) {
      console.error('Error fetching story card:', error)
      // toast({
      //   title: 'Error',
      //   description: 'Failed to fetch story card',
      //   status: 'error',
      //   duration: 9000,
      //   isClosable: true,
      // })
    } finally {
      setIsLoading(false)
    }
  }

  const nextStep = async (choice: number) => {
    console.log('next step:', choice)
    setIsLoading(true)
    setShowOptions(false)
    try {
      const gameId = id
      if (!sessionToken) {
        throw new Error('No session token found')
      }

      const updateResponse = await fetch(`/api/updateGameStep?token=${sessionToken}&gameId=${id}&storyName=${storyName}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ nextStep: choice }),
      })

      if (!updateResponse.ok) {
        const errorData = await updateResponse.json()
        throw new Error(errorData.error || 'Failed to update game state')
      }

      const responseData = await updateResponse.json()
      console.log('Response data:', responseData) // Add this log

      // Update game state
      setCurrentStep(choice)
      await fetchCard(choice)

      // Check for transaction info and show toast
      if (responseData.transaction) {
        console.log('Transaction data:', responseData.transaction) // Add this log
        toast({
          title: 'Check your wallet!',
          description: (
            <Box>
              <Text>{responseData.transaction.message}</Text>
              <Text mt={2}>
                Transaction hash:{' '}
                <Link target={'_blank'} href={`https://basescan.org/tx/${responseData.transaction.txHash}`} isExternal color="blue.500">
                  {responseData.transaction.txHash.substring(0, 10)}...
                </Link>
              </Text>
            </Box>
          ),
          status: 'success',
          duration: 10000,
          isClosable: true,
        })
      }
    } catch (error) {
      console.error('Error advancing to next step:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'An error occurred while updating the game state',
        status: 'error',
        duration: 9000,
        isClosable: true,
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    console.log('localStorage.getItem:', localStorage.getItem('avventuraSessionToken'))
    setSessionToken(localStorage.getItem('avventuraSessionToken') || '')

    if (localStorage.getItem('avventuraSessionToken')) {
      fetchInitialStep(localStorage.getItem('avventuraSessionToken') || 'yo')
    } else {
      toast({
        title: 'Info',
        description: "Merci de commencer l'aventure comme il faut.",
        status: 'info',
        duration: 9000,
        isClosable: true,
      })
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
    return (
      <Flex flexDirection="column" height="100vh" padding={4}>
        <VStack spacing={4} flex={1} width="100%">
          <Box width="100%" maxHeight="180px" overflowY="auto" marginBottom={4} marginTop={10}>
            <HeadingComponent as="h4">
              <TypingEffect text={"We can't find the story or the current step... Sorry for that!"} onComplete={handleTypingComplete} />
            </HeadingComponent>
          </Box>
          {showOptions && (
            <VStack spacing={4} width="100%">
              <Box
                width="100%"
                borderRadius="lg"
                p={4}
                borderWidth="2px"
                // onClick={() => nextStep(story.paths[index])}
                cursor="pointer"
                _hover={{
                  borderColor: '#8c1c84',
                  boxShadow: 'md',
                }}
                transition="all 0.2s">
                <Text fontSize="lg" fontWeight="medium" color={'#45a2f8'} _hover={{ color: '#45a2f8' }}>
                  Sorry for that!
                </Text>
              </Box>
            </VStack>
          )}
        </VStack>
      </Flex>
    )
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
