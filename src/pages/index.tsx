import * as React from 'react'
import { Button, Input, Text, FormControl, FormLabel, useToast } from '@chakra-ui/react'
import { useState } from 'react'
import { useRouter } from 'next/router'
import { HeadingComponent } from '../components/layout/HeadingComponent'

export default function Home() {
  const [name, setName] = useState('')
  const [isStartLoading, setIsStartLoading] = useState(false)
  const [isResumeLoading, setIsResumeLoading] = useState(false)
  const toast = useToast()

  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsStartLoading(true)

    if (name.trim()) {
      try {
        const response = await fetch('/api/startGame', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userName: name }),
        })

        const data = await response.json()

        console.log('start game response:', data)
        console.log('id:', data.game.id)
        console.log('token:', data.game.sessions[0])

        localStorage.setItem('avventuraSessionToken', data.game.sessions[0])

        if (data.success) {
          toast({
            title: `Hello ${name}!`,
            description: 'Good luck in this adventure!',
            status: 'success',
            duration: 5000,
            isClosable: true,
          })
          router.push(`/optimistic-life/${data.game.id}`)
        } else {
          throw new Error(data.error || 'Échec du démarrage de la partie')
        }
      } catch (error) {
        console.error('fail to start the game:', error)
        toast({
          title: 'Woops',
          description: 'Sorry for this error! Please retry.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        })
      } finally {
        setIsStartLoading(false)
      }
    } else {
      setIsStartLoading(false)
    }
  }

  const resume = async (e: React.FormEvent) => {
    setIsResumeLoading(true)
    console.log('localStorage.getItem:', localStorage.getItem('avventuraSessionToken'))

    if (localStorage.getItem('avventuraSessionToken')) {
      try {
        const response = await fetch(`/api/getGameID?sessionToken=${localStorage.getItem('avventuraSessionToken')}`)
        const data = await response.json()

        if (data.gameID) {
          console.log('Game ID:', data.gameID)
          router.push(`/optimistic-life/${data.gameID}`)
        } else {
          console.error('Game ID not found in response')
          toast({
            title: 'Erreur',
            description: "Impossible de reprendre la partie. L'ID de jeu n'a pas été trouvé.",
            status: 'error',
            duration: 5000,
            isClosable: true,
          })
        }
      } catch (error) {
        console.error('Error resuming game:', error)
        toast({
          title: 'Erreur',
          description: 'Une erreur est survenue lors de la reprise de la partie.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        })
      } finally {
        setIsResumeLoading(false)
      }
    } else {
      toast({
        title: 'Slowly!',
        description: 'Please start a game first.',
        status: 'info',
        duration: 9000,
        isClosable: true,
      })
      setIsResumeLoading(false)
    }
  }

  return (
    <>
      <HeadingComponent as="h4">Start a new game</HeadingComponent>
      <br />
      <FormControl as="form" onSubmit={handleSubmit}>
        <FormLabel>What is your first name or nickname, please?</FormLabel>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Francis" />
        <Button type="submit" colorScheme="green" mt={5} mb={5} isLoading={isStartLoading} loadingText="Starting..." spinnerPlacement="end">
          Let&apos;s go!
        </Button>
      </FormControl>
      <br />
      <HeadingComponent as="h4">Resume your game</HeadingComponent>
      <Button onClick={resume} colorScheme="blue" mt={5} mb={5} isLoading={isResumeLoading} loadingText="Resuming..." spinnerPlacement="end">
        Resume
      </Button>
    </>
  )
}
