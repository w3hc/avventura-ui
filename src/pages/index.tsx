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
            title: `Salut à toi, ${name} !`,
            description: 'Bonne chance pour cette aventure !',
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
          description: 'Mille excuses, nous avons rencontré un souci...',
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
        title: 'Doucement !',
        description: "Veuillez d'abord commencer une partie, s'il vous plaît.",
        status: 'info',
        duration: 9000,
        isClosable: true,
      })
      setIsResumeLoading(false)
    }
  }

  return (
    <>
      <HeadingComponent as="h4">Commencer une nouvelle partie</HeadingComponent>
      <br />
      <FormControl as="form" onSubmit={handleSubmit}>
        <FormLabel>Quel est votre prénom ou pseudo, s&apos;il vous plaît ?</FormLabel>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Francis" />
        <Button type="submit" colorScheme="green" mt={5} mb={5} isLoading={isStartLoading} loadingText="Démarrage..." spinnerPlacement="end">
          C&apos;est parti !
        </Button>
      </FormControl>
      <br />
      <HeadingComponent as="h4">Reprendre votre partie</HeadingComponent>
      <Button onClick={resume} colorScheme="blue" mt={5} mb={5} isLoading={isResumeLoading} loadingText="Chargement..." spinnerPlacement="end">
        J&apos;y retourne !
      </Button>
    </>
  )
}
