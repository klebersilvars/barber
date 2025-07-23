"use client"

import type React from "react"

import {
    Box,
    Button,
    Container,
    FormControl,
    FormLabel,
    Heading,
    Input,
    InputGroup,
    InputLeftElement,
    InputRightElement,
    Link,
    Text,
    useColorModeValue,
    VStack,
    HStack,
    IconButton,
    Alert,
    AlertIcon,
} from "@chakra-ui/react"
import { useState } from "react"
import { ViewIcon, ViewOffIcon, EmailIcon, LockIcon } from "@chakra-ui/icons"
import { auth } from "../../../firebase/firebase"
import { signInWithEmailAndPassword } from "firebase/auth"
import { useNavigate } from "react-router-dom"
import { collection, getDocs, query, where } from 'firebase/firestore';
import { firestore } from '../../../firebase/firebase';

export default function LoginFundador() {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [error, setError] = useState("")
    const navigation = useNavigate()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setError("")

        // Verificar se o e-mail está autorizado na coleção acesso_fundador
        try {
            const acessoRef = collection(firestore, 'acesso_fundador');
            const q = query(acessoRef, where('email_fundador', '==', email));
            const querySnapshot = await getDocs(q);
            if (querySnapshot.empty) {
                setIsLoading(false);
                setError('Acesso não autorizado!');
                return;
            }
        } catch (err) {
            setIsLoading(false);
            setError('Erro ao verificar permissão de acesso!');
            return;
        }

        await signInWithEmailAndPassword(auth, email, password)
        .then((userLOGADO)=> {
            const userID = userLOGADO.user.uid //pegando o uid do usuário logado
            alert('Usuário logado com sucesso!')
            navigation(`/dashboardFundador/${userID}`)

        }).catch(() => {
            setError('Email ou senha inválidos!');
            setIsLoading(false);
        })
    }

    const bgColor = useColorModeValue("gray.50", "gray.900")
    const cardBg = useColorModeValue("white", "gray.800")
    const textColor = useColorModeValue("gray.600", "gray.400")

    return (
        <Box minH="100vh" bg={bgColor} py={12} px={6}>
            <Container maxW="lg" centerContent>
                <VStack spacing={8} w="full">
                    {/* Header */}
                    <VStack spacing={2} textAlign="center">
                        <Heading
                            fontSize={{ base: "2xl", md: "3xl" }}
                            bgGradient="linear(to-r, blue.400, purple.500)"
                            bgClip="text"
                        >
                            Página da administração geral
                        </Heading>
                        <Text color={textColor} fontSize={{ base: "sm", md: "md" }}>
                            Entre na sua conta para administrar a plataforma
                        </Text>
                    </VStack>

                    {/* Login Card */}
                    <Box
                        bg={cardBg}
                        boxShadow="2xl"
                        rounded="xl"
                        p={{ base: 6, md: 8 }}
                        w="full"
                        maxW="md"
                        border="1px"
                        borderColor={useColorModeValue("gray.200", "gray.700")}
                    >
                        <form onSubmit={handleSubmit}>
                            <VStack spacing={6}>
                                {error && (
                                    <Alert status="error" rounded="md">
                                        <AlertIcon />
                                        {error}
                                    </Alert>
                                )}

                                {/* Email Field */}
                                <FormControl isRequired>
                                    <FormLabel color={textColor}>Email do administrador</FormLabel>
                                    <InputGroup>
                                        <InputLeftElement pointerEvents="none">
                                            <EmailIcon color="gray.400" />
                                        </InputLeftElement>
                                        <Input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="seu@email.com"
                                            focusBorderColor="blue.400"
                                            _hover={{ borderColor: "blue.300" }}
                                        />
                                    </InputGroup>
                                </FormControl>

                                {/* Password Field */}
                                <FormControl isRequired>
                                    <FormLabel color={textColor}>Senha do administrador</FormLabel>
                                    <InputGroup>
                                        <InputLeftElement pointerEvents="none">
                                            <LockIcon color="gray.400" />
                                        </InputLeftElement>
                                        <Input
                                            type={showPassword ? "text" : "password"}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="Digite sua senha"
                                            focusBorderColor="blue.400"
                                            _hover={{ borderColor: "blue.300" }}
                                        />
                                        <InputRightElement>
                                            <IconButton
                                                aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                                                icon={showPassword ? <ViewOffIcon /> : <ViewIcon />}
                                                onClick={() => setShowPassword(!showPassword)}
                                                variant="ghost"
                                                size="sm"
                                            />
                                        </InputRightElement>
                                    </InputGroup>
                                </FormControl>

                                {/* Remember Me & Forgot Password */}
                                <HStack justify="space-between" w="full">
                                    <Link fontSize="sm" color="blue.400" _hover={{ color: "blue.500", textDecoration: "underline" }}>
                                        Esqueci a senha
                                    </Link>
                                </HStack>

                                {/* Login Button */}
                                <Button
                                    type="submit"
                                    w="full"
                                    size="lg"
                                    bgGradient="linear(to-r, blue.400, purple.500)"
                                    color="white"
                                    _hover={{
                                        bgGradient: "linear(to-r, blue.500, purple.600)",
                                        transform: "translateY(-1px)",
                                        boxShadow: "lg",
                                    }}
                                    _active={{
                                        transform: "translateY(0)",
                                    }}
                                    isLoading={isLoading}
                                    loadingText="Entrando..."
                                    transition="all 0.2s"
                                >
                                    Entrar
                                </Button>


                            </VStack>
                        </form>
                    </Box>
                </VStack>
            </Container>
        </Box>
    )
}
