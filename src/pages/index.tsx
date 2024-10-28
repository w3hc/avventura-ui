import { VStack, Button, useToast, Text } from '@chakra-ui/react'
import { useRouter } from 'next/router'
import { HeadingComponent } from '../components/layout/HeadingComponent'
import StoriesGrid from '../components/layout/StoriesGrid'
import { useState } from 'react'
import { LinkComponent } from '../components/layout/LinkComponent'

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
        <Button onClick={resume} colorScheme="blue" isLoading={isResumeLoading} loadingText="Resuming..." spinnerPlacement="end" mb={20}>
          Resume
        </Button>
      </VStack>
      <VStack spacing={4} align="stretch" mt={8}>
        <HeadingComponent as="h4">Info</HeadingComponent>
        <Text mb={20}>
          Avventura is developed by the <LinkComponent href="https://github.com/w3hc">W3HC</LinkComponent>. You can access the{' '}
          <LinkComponent href="https://github.com/w3hc/avventura-ui">GitHub repository</LinkComponent> or{' '}
          <LinkComponent href="https://github.com/w3hc/avventura-ui/blob/main/DOCS.md">docs</LinkComponent> here. You can edit your own story in a few
          minutes. Feel free to contact Julien via <LinkComponent href="https://matrix.to/#/@julienbrg:matrix.org">Element</LinkComponent>,{' '}
          <LinkComponent href="https://warpcast.com/julien-">Farcaster</LinkComponent>,{' '}
          <LinkComponent href="https://t.me/julienbrg">Telegram</LinkComponent>,{' '}
          <LinkComponent href="https://twitter.com/julienbrg">Twitter</LinkComponent>,{' '}
          <LinkComponent href="https://discordapp.com/users/julienbrg">Discord</LinkComponent> or{' '}
          <LinkComponent href="https://www.linkedin.com/in/julienberanger/">LinkedIn</LinkComponent>.
        </Text>
      </VStack>
    </VStack>
  )
}
