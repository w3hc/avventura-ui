import React, { ReactNode } from 'react'
import { Text, Button, useToast, Box, VStack, Flex } from '@chakra-ui/react'
import { useRouter } from 'next/router'
import { HeadingComponent } from '../../components/layout/HeadingComponent'
import { LinkComponent } from '../../components/layout/LinkComponent'
import { useState, useEffect } from 'react'

interface Props {
  href: string
  children: ReactNode
  isExternal?: boolean
  className?: string
  onClick?: () => void
}

interface StoryCard {
  step: number
  desc: string
  options: string[]
  paths: number[]
}

export default function Play() {
  const router = useRouter()
  const toast = useToast()

  useEffect(() => {
    router.push('/')
  }, [])
}
