import './App.css'
import AppRoutes from './appRoute'
import { ChakraProvider } from '@chakra-ui/react'
import { SpeedInsights } from '@vercel/speed-insights/react';

function App() {
  return (
    <ChakraProvider>
      <AppRoutes/>
      <SpeedInsights />
      
    </ChakraProvider>
  )
}

export default App
