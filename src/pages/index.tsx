import * as React from 'react'
import { Button, Input, Text, FormControl, FormLabel, useToast, VStack, Select, Box } from '@chakra-ui/react'
import { useState } from 'react'
import { useRouter } from 'next/router'
import { HeadingComponent } from '../components/layout/HeadingComponent'

const STORIES = [
  {
    name: 'In the Desert',
    slug: 'in-the-desert',
    description: 'Survive a perilous journey through the desert.',
  },
  {
    name: 'Optimistic Life',
    slug: 'optimistic-life',
    description: 'Live an adventure in a smart contract world filled with optimism.',
  },
]

export default function Home() {
  const [name, setName] = useState('Francis')
  const [walletAddress, setWalletAddress] = useState('0xD8a394e7d7894bDF2C57139fF17e5CBAa29Dd977')
  const [selectedStory, setSelectedStory] = useState(STORIES[0].slug)
  const [isStartLoading, setIsStartLoading] = useState(false)
  const [isResumeLoading, setIsResumeLoading] = useState(false)
  const toast = useToast()
  const router = useRouter()

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

  return (
    <VStack spacing={6} align="stretch">
      <HeadingComponent as="h4">Start a new game</HeadingComponent>

      <FormControl as="form" onSubmit={handleSubmit}>
        <FormLabel>Select a story</FormLabel>
        <Select value={selectedStory} onChange={(e) => setSelectedStory(e.target.value)} mb={4}>
          {STORIES.map((story) => (
            <option key={story.slug} value={story.slug}>
              {story.name}
            </option>
          ))}
        </Select>

        {selectedStory && (
          <Text mb={4} color="gray.500">
            {STORIES.find((s) => s.slug === selectedStory)?.description}
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
