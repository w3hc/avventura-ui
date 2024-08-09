import * as React from 'react'
import { Button, Input, Text, FormControl, FormLabel, useToast } from '@chakra-ui/react'
import { useState } from 'react'
import { useRouter } from 'next/router'

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

        // TODO: store session token in local storage (or cookie ?)

        if (data.success) {
          toast({
            title: "C'est parti !",
            description: `Salut à toi, ${name} ! Bonne chance pour cette aventure !`,
            status: 'success',
            duration: 5000,
            isClosable: true,
          })
          router.push('/play/1')
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

  return (
    <>
      <FormControl as="form" onSubmit={handleSubmit}>
        <FormLabel>Quel est votre prénom ou pseudo, s&apos;il vous plaît ?</FormLabel>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Francis" />
        <Button type="submit" colorScheme="blue" mt={5} mb={5}>
          C&apos;est parti !
        </Button>
      </FormControl>
    </>
  )
}
