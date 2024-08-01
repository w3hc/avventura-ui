import { ThemingProps } from '@chakra-ui/react'
export const SITE_DESCRIPTION = 'Text-based Web3 RPG'
export const SITE_NAME = 'Avventura'
export const SITE_URL = 'https://avventura.fun'

export const THEME_INITIAL_COLOR = 'system'
export const THEME_COLOR_SCHEME: ThemingProps['colorScheme'] = 'blue'
export const THEME_CONFIG = {
  initialColorMode: THEME_INITIAL_COLOR,
}

export const SOCIAL_TWITTER = 'w3hc8'
export const SOCIAL_GITHUB = 'w3hc/avventura-ui'

export const SERVER_SESSION_SETTINGS = {
  cookieName: SITE_NAME,
  password: process.env.SESSION_PASSWORD ?? '',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
  },
}
