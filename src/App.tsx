import './App.css'
import AppRoutes from './appRoute'
import { ChakraProvider } from '@chakra-ui/react'

function App() {
  return (
    <ChakraProvider>
      <AppRoutes/>
    </ChakraProvider>
  )
}

export default App
