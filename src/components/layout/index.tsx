import { Web3Modal } from '../../context/web3modal'
import { ReactNode } from 'react'
import { Box, Container } from '@chakra-ui/react'
import { Header } from './Header'
import { useRouter } from 'next/router'

interface Props {
  children?: ReactNode
}

export default function RootLayout({ children }: Props) {
  const router = useRouter()
  const isHomePage = router.pathname === '/' || router.pathname === '/index'

  return (
    <Web3Modal>
      <Box margin="0 auto" minH="100vh">
        {isHomePage && <Header />}
        <Container maxW="container.lg">{children}</Container>
      </Box>
    </Web3Modal>
  )
}
