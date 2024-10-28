import { useState, useEffect } from 'react'
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

  // Helper function to format story name
  const formatStoryName = (name: string) => {
    if (name === 'pirate-math') return 'Moussaillon des maths'
    return name
      ?.split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsStartLoading(true)

    if (!name.trim()) {
      const errorMessage = storyName === 'pirate-math' ? 'Veuillez entrer votre nom' : 'Please enter your name'

      toast({
        title: 'Error',
        description: errorMessage,
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

        const successMessage = storyName === 'pirate-math' ? `Bonjour ${name} !` : `Hello ${name}!`

        const descriptionMessage = storyName === 'pirate-math' ? 'Bonne chance dans cette aventure !' : 'Good luck in this adventure!'

        toast({
          title: successMessage,
          description: descriptionMessage,
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
      const errorMessage =
        storyName === 'pirate-math' ? 'Désolé, une erreur est survenue ! Veuillez réessayer.' : 'Sorry, an error occurred! Please try again.'

      toast({
        title: 'Error',
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    } finally {
      setIsStartLoading(false)
    }
  }

  return (
    <Flex flexDirection="column" height="100vh" padding={4} mt={20}>
      <VStack spacing={6} align="stretch">
        <HeadingComponent as="h4" className="mt-10">
          {formatStoryName(storyName as string)}
        </HeadingComponent>

        <FormControl as="form" onSubmit={handleSubmit}>
          <FormLabel>{storyName === 'pirate-math' ? 'Quel est votre prénom ou surnom ?' : 'What is your first name or nickname?'}</FormLabel>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Francis" mb={4} />

          {storyName !== 'pirate-math' && (
            <>
              <FormLabel>Your Ethereum wallet address</FormLabel>
              <Input value={walletAddress} onChange={(e) => setWalletAddress(e.target.value)} placeholder="0x..." mb={4} />
            </>
          )}

          <Button
            type="submit"
            colorScheme="green"
            isLoading={isStartLoading}
            loadingText={storyName === 'pirate-math' ? 'Démarrage...' : 'Starting...'}
            spinnerPlacement="end">
            {storyName === 'pirate-math' ? "C'est parti !" : "Let's go!"}
          </Button>
        </FormControl>
      </VStack>
    </Flex>
  )
}
