import React, { ReactNode } from 'react'
import NextLink from 'next/link'
import { Link } from '@chakra-ui/react'

interface Props {
  href: string
  children: ReactNode
  isExternal?: boolean
  className?: string
  onClick?: () => void
}

export function LinkComponent(props: Props) {
  const className = props.className ?? ''
  const isExternal = props.href.match(/^([a-z0-9]*:|.{0})\/\/.*$/) || props.isExternal

  if (isExternal) {
    return (
      <Link
        className={className}
        href={props.href}
        target="_blank"
        rel="noopener noreferrer"
        onClick={props.onClick}
        color="#45a2f8"
        _hover={{ textDecoration: 'underline' }}>
        {props.children}
      </Link>
    )
  }

  return (
    <Link as={NextLink} className={className} href={props.href} onClick={props.onClick} color="#45a2f8" _hover={{ textDecoration: 'underline' }}>
      {props.children}
    </Link>
  )
}
