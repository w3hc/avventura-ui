import React, { useState } from 'react'
import { Button, Input, FormControl, FormLabel, useToast } from '@chakra-ui/react'
import { useRouter } from 'next/router'
import { HeadingComponent } from '../../components/layout/HeadingComponent'

export default function Editor() {
  const [name, setName] = useState('')
  const toast = useToast()
  const router = useRouter()

  const createStory = async (e: any) => {
    e.preventDefault()

    if (!name.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a story name',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
      return
    }

    try {
      const response = await fetch('/api/createStory', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name }),
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: 'Story created',
          description: `Have fun editing ${name}!`,
          status: 'success',
          duration: 5000,
          isClosable: true,
        })
        router.push(`/editor/${data.storyName}`)
      } else {
        throw new Error(data.error || 'Failed to create story')
      }
    } catch (error) {
      console.error('Failed to create the story:', error)
      toast({
        title: 'Error',
        description: 'Sorry, we encountered an issue...',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    }
  }

  return (
    <>
      <HeadingComponent as="h4">Create a new story</HeadingComponent>
      <FormControl as="form" onSubmit={createStory}>
        <FormLabel>Story name</FormLabel>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter story name" />
        <Button onClick={createStory} colorScheme="green" mt={5} mb={5} type="submit">
          Create story
        </Button>
      </FormControl>
    </>
  )
}
