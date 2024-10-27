import { useState } from 'react'
import { useRouter } from 'next/router'
import { Button, Input, FormControl, FormLabel, useToast, VStack, Flex } from '@chakra-ui/react'
import { HeadingComponent } from '../../components/layout/HeadingComponent'

export default function StoryStart() {
  const [name, setName] = useState('Francis')
  const [walletAddress, setWalletAddress] = useState('0xD8a394e7d7894bDF2C57139fF17e5CBAa29Dd977')
  const [isStartLoading, setIsStartLoading] = useState(false)
  const toast = useToast()
  const router = useRouter()
  const { storyName } = router.query

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
          story: storyName,
        }),
      })

      const data = await response.json()

      if (data.success) {
        localStorage.setItem('avventuraSessionToken', data.game.sessions[0])
        localStorage.setItem('avventuraStory', storyName as string)
        toast({
          title: `Hello ${name}!`,
          description: 'Good luck in this adventure!',
          status: 'success',
          duration: 5000,
          isClosable: true,
        })
        router.push(`/${storyName}/${data.game.id}`)
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

  return (
    <Flex flexDirection="column" height="100vh" padding={4}>
      <VStack spacing={6} align="stretch">
        <HeadingComponent as="h4">Start your adventure</HeadingComponent>

        <FormControl as="form" onSubmit={handleSubmit}>
          <FormLabel>What is your first name or nickname?</FormLabel>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Francis" mb={4} />

          <FormLabel>Your Ethereum wallet address</FormLabel>
          <Input value={walletAddress} onChange={(e) => setWalletAddress(e.target.value)} placeholder="0x..." mb={4} />

          <Button type="submit" colorScheme="green" isLoading={isStartLoading} loadingText="Starting..." spinnerPlacement="end">
            Let&apos;s go!
          </Button>
        </FormControl>
      </VStack>
    </Flex>
  )
}
