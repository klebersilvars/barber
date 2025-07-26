import './App.css'
import AppRoutes from './appRoute'
import { ChakraProvider } from '@chakra-ui/react'
import CookieBanner from './components/CookieBanner/CookieBanner'
import CookieSettingsButton from './components/CookieSettingsButton/CookieSettingsButton'

function App() {
  return (
    <ChakraProvider>
      <AppRoutes/>
      <CookieBanner />
      <CookieSettingsButton />
    </ChakraProvider>
  )
}

export default App
