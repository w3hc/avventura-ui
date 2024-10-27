import { VStack, Button, useToast } from '@chakra-ui/react'
import { useRouter } from 'next/router'
import { HeadingComponent } from '../components/layout/HeadingComponent'
import StoriesGrid from '../components/layout/StoriesGrid'
import { useState } from 'react'

export default function Home() {
  const [isResumeLoading, setIsResumeLoading] = useState(false)
  const toast = useToast()
  const router = useRouter()

  const resume = async () => {
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
    <VStack spacing={8} align="stretch">
      <HeadingComponent as="h4">Choose your adventure</HeadingComponent>
      <StoriesGrid />

      <VStack spacing={4} align="stretch" mt={8}>
        <HeadingComponent as="h4">Resume your game</HeadingComponent>
        <Button onClick={resume} colorScheme="blue" isLoading={isResumeLoading} loadingText="Resuming..." spinnerPlacement="end">
          Resume
        </Button>
      </VStack>
    </VStack>
  )
}
