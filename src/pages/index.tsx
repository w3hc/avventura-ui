import * as React from 'react'
import { Button, Input, Text, FormControl, FormLabel, useToast } from '@chakra-ui/react'
import { useState } from 'react'
import { useRouter } from 'next/router'
import { HeadingComponent } from '../components/layout/HeadingComponent'

export default function Home() {
  const [name, setName] = useState('')
  const toast = useToast()

  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

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
          router.push(`/play/${data.game.id}`)
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
      }
    }
  }

  const resume = async (e: React.FormEvent) => {
    // get game ID from session token in local storage
    console.log('localStorage.getItem:', localStorage.getItem('avventuraSessionToken'))

    if (localStorage.getItem('avventuraSessionToken')) {
      const response = await fetch(`/api/getGameID?sessionToken=${localStorage.getItem('avventuraSessionToken')}`)
      const data = await response.json()

      if (data.gameID) {
        console.log('Game ID:', data.gameID)
        router.push(`/play/${data.gameID}`)
      } else {
        console.error('Game ID not found in response')
      }
    } else {
      toast({
        title: 'Doucement !',
        description: "Veuillez d'abord commencer une partie, s'il vous plaît.",
        status: 'info',
        duration: 9000,
        isClosable: true,
      })
    }
  }
  return (
    <>
      <HeadingComponent as="h4">Commencer une nouvelle partie</HeadingComponent>
      <br />
      <FormControl as="form" onSubmit={handleSubmit}>
        <FormLabel>Quel est votre prénom ou pseudo, s&apos;il vous plaît ?</FormLabel>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Francis" />
        <Button type="submit" colorScheme="green" mt={5} mb={5}>
          C&apos;est parti !
        </Button>
      </FormControl>
      <br />
      <HeadingComponent as="h4">Reprendre votre partie</HeadingComponent>
      <Button onClick={resume} colorScheme="blue" mt={5} mb={5}>
        J&apos;y retourne !
      </Button>
    </>
  )
}
