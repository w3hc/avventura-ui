const isProd = process.env.NODE_ENV === 'production'

export const API_BASE_URL = isProd ? 'https://avventura.jcloud-ver-jpe.ik-server.com' : 'http://localhost:3000'
