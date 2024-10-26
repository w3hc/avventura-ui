import * as React from 'react'
import { Button, Input, Text, FormControl, FormLabel, useToast, VStack, Select, Box, Spinner } from '@chakra-ui/react'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { HeadingComponent } from '../components/layout/HeadingComponent'

interface Story {
  name: string
  slug: string
  description: string
}

export default function Home() {
  const [name, setName] = useState('')
  const [walletAddress, setWalletAddress] = useState('')
  const [selectedStory, setSelectedStory] = useState('')
  const [stories, setStories] = useState<Story[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isStartLoading, setIsStartLoading] = useState(false)
  const [isResumeLoading, setIsResumeLoading] = useState(false)
  const toast = useToast()
  const router = useRouter()

  useEffect(() => {
    fetchStories()
  }, [])

  const fetchStories = async () => {
    try {
      const response = await fetch('/api/getStories')
      if (response.ok) {
        const data = await response.json()
        setStories(data)
        if (data.length > 0) {
          setSelectedStory(data[0].slug)
        }
      } else {
        throw new Error('Failed to fetch stories')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load available stories',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const validateWalletAddress = (address: string) => {
    return /^0x[a-fA-F0-9]{40}$/.test(address)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsStartLoading(true)

    if (!name.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter your name',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
      setIsStartLoading(false)
      return
    }

    if (!selectedStory) {
      toast({
        title: 'Error',
        description: 'Please select a story',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
      setIsStartLoading(false)
      return
    }

    if (!validateWalletAddress(walletAddress)) {
      toast({
        title: 'Error',
        description: 'Please enter a valid Ethereum wallet address',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
      setIsStartLoading(false)
      return
    }

    try {
      const response = await fetch('/api/startGame', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userName: name,
          walletAddress: walletAddress,
          story: selectedStory,
        }),
      })

      const data = await response.json()

      if (data.success) {
        localStorage.setItem('avventuraSessionToken', data.game.sessions[0])
        localStorage.setItem('avventuraStory', selectedStory)
        toast({
          title: `Hello ${name}!`,
          description: 'Good luck in this adventure!',
          status: 'success',
          duration: 5000,
          isClosable: true,
        })
        router.push(`/${selectedStory}/${data.game.id}`)
      } else {
        throw new Error(data.error || 'Failed to start game')
      }
    } catch (error) {
      console.error('Failed to start game:', error)
      toast({
        title: 'Error',
        description: 'Sorry, an error occurred! Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    } finally {
      setIsStartLoading(false)
    }
  }

  const resume = async (e: React.FormEvent) => {
    setIsResumeLoading(true)
    const sessionToken = localStorage.getItem('avventuraSessionToken')
    const savedStory = localStorage.getItem('avventuraStory')

    if (sessionToken && savedStory) {
      try {
        const response = await fetch(`/api/getGameID?sessionToken=${sessionToken}`)
        const data = await response.json()

        if (data.gameID) {
          router.push(`/${savedStory}/${data.gameID}`)
        } else {
          toast({
            title: 'Error',
            description: 'Unable to resume game. Game ID not found.',
            status: 'error',
            duration: 5000,
            isClosable: true,
          })
        }
      } catch (error) {
        toast({
          title: 'Error',
          description: 'An error occurred while resuming the game.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        })
      }
    } else {
      toast({
        title: 'Slowly!',
        description: 'Please start a game first.',
        status: 'info',
        duration: 9000,
        isClosable: true,
      })
    }
    setIsResumeLoading(false)
  }

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <Spinner size="xl" />
      </Box>
    )
  }

  return (
    <VStack spacing={6} align="stretch">
      <HeadingComponent as="h4">Start a new game</HeadingComponent>

      <FormControl as="form" onSubmit={handleSubmit}>
        <FormLabel>Select a story</FormLabel>
        <Select value={selectedStory} onChange={(e) => setSelectedStory(e.target.value)} mb={4}>
          {stories.map((story) => (
            <option key={story.slug} value={story.slug}>
              {story.name}
            </option>
          ))}
        </Select>

        {selectedStory && (
          <Text mb={4} color="gray.500">
            {stories.find((s) => s.slug === selectedStory)?.description}
          </Text>
        )}

        <FormLabel>What is your first name or nickname?</FormLabel>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Francis" mb={4} />

        <FormLabel>Your Ethereum wallet address</FormLabel>
        <Input value={walletAddress} onChange={(e) => setWalletAddress(e.target.value)} placeholder="0x..." mb={4} />

        <Button type="submit" colorScheme="green" isLoading={isStartLoading} loadingText="Starting..." spinnerPlacement="end">
          Let&apos;s go!
        </Button>
      </FormControl>

      <HeadingComponent as="h4">Resume your game</HeadingComponent>
      <Button onClick={resume} colorScheme="blue" isLoading={isResumeLoading} loadingText="Resuming..." spinnerPlacement="end">
        Resume
      </Button>
    </VStack>
  )
}
