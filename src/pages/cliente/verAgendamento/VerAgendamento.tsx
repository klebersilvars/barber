"use client"

import type React from "react"
import { useState } from "react"
import {
  Box,
  Button,
  Input,
  Card,
  CardBody,
  Badge,
  Text,
  Heading,
  VStack,
  HStack,
  IconButton,
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  useDisclosure,
  Container,
  Flex,
  Spacer,
  FormControl,
  FormLabel,
  FormErrorMessage,
  useToast,
  useColorModeValue,
  Avatar,
  Divider,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
} from "@chakra-ui/react"
import {
  HamburgerIcon,
  PhoneIcon,
  CalendarIcon,
  TimeIcon,
  StarIcon,
  ChevronRightIcon,
  CheckCircleIcon,
  WarningIcon,
  SearchIcon,
} from "@chakra-ui/icons"

interface Agendamento {
  id: string
  data: string
  hora: string
  servico: string
  status: "confirmado" | "concluido" | "cancelado"
  avaliacao?: number
}

export default function VerAgendamento() {
  const [telefone, setTelefone] = useState("")
  const [mostrarAgendamentos, setMostrarAgendamentos] = useState(false)
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [secaoAtiva, setSecaoAtiva] = useState("agendamentos")
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState("")
  const [avaliacaoSelecionada, setAvaliacaoSelecionada] = useState<{ [key: string]: number }>({})
  const toast = useToast()

  const bgGradient = useColorModeValue(
    "linear(to-br, blue.50, purple.50, pink.50)",
    "linear(to-br, gray.900, blue.900, purple.900)",
  )
  const cardBg = useColorModeValue("white", "gray.800")
  const headerBg = useColorModeValue("linear(to-r, blue.500, purple.500)", "linear(to-r, blue.600, purple.600)")
  const accentColor = useColorModeValue("purple.500", "purple.300")

  const [agendamentos] = useState<Agendamento[]>([
    {
      id: "1",
      data: "2024-01-15",
      hora: "14:30",
      servico: "Corte de Cabelo",
      status: "confirmado",
    },
    {
      id: "2",
      data: "2024-01-20",
      hora: "16:00",
      servico: "Manicure",
      status: "confirmado",
    },
  ])

  const [agendamentosAntigos] = useState<Agendamento[]>([
    {
      id: "3",
      data: "2023-12-10",
      hora: "15:00",
      servico: "Corte de Cabelo",
      status: "concluido",
      avaliacao: 5,
    },
    {
      id: "4",
      data: "2023-11-25",
      hora: "10:30",
      servico: "Pedicure",
      status: "concluido",
      avaliacao: 4,
    },
    {
      id: "5",
      data: "2023-11-15",
      hora: "14:00",
      servico: "Massagem",
      status: "cancelado",
    },
  ])

  const buscarAgendamentos = async () => {
    if (!telefone.trim()) {
      setErro("Por favor, digite seu número de telefone")
      return
    }

    if (telefone.length < 10) {
      setErro("Número de telefone inválido")
      return
    }

    setCarregando(true)
    setErro("")

    // Simular chamada de API
    setTimeout(() => {
      setMostrarAgendamentos(true)
      setCarregando(false)
      toast({
        title: "Agendamentos encontrados!",
        status: "success",
        duration: 3000,
        isClosable: true,
      })
    }, 1500)
  }

  const formatarTelefone = (valor: string) => {
    const numeros = valor.replace(/\D/g, "")
    if (numeros.length <= 11) {
      return numeros.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3")
    }
    return valor
  }

  const handleTelefoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valorFormatado = formatarTelefone(e.target.value)
    setTelefone(valorFormatado)
    if (erro) setErro("")
  }

  const avaliarAtendimento = (agendamentoId: string, nota: number) => {
    setAvaliacaoSelecionada((prev) => ({
      ...prev,
      [agendamentoId]: nota,
    }))
    toast({
      title: `Avaliação de ${nota} estrelas registrada!`,
      status: "success",
      duration: 2000,
      isClosable: true,
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmado":
        return "blue"
      case "concluido":
        return "green"
      case "cancelado":
        return "red"
      default:
        return "gray"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "confirmado":
        return <CheckCircleIcon />
      case "concluido":
        return <CheckCircleIcon />
      case "cancelado":
        return <WarningIcon />
      default:
        return <TimeIcon />
    }
  }

  const renderStars = (agendamentoId: string, avaliacaoAtual?: number) => {
    const avaliacao = avaliacaoSelecionada[agendamentoId] || avaliacaoAtual || 0

    return (
      <HStack spacing={1}>
        {[1, 2, 3, 4, 5].map((star) => (
          <IconButton
            key={star}
            aria-label={`${star} estrelas`}
            icon={<StarIcon />}
            size="sm"
            variant="ghost"
            color={star <= avaliacao ? "yellow.400" : "gray.300"}
            onClick={() => avaliarAtendimento(agendamentoId, star)}
            isDisabled={!!avaliacaoAtual}
            _hover={{ transform: "scale(1.1)" }}
            transition="all 0.2s"
          />
        ))}
      </HStack>
    )
  }

  if (!mostrarAgendamentos) {
    return (
      <Box
        minH="100vh"
        bgGradient={bgGradient}
        display="flex"
        alignItems="center"
        justifyContent="center"
        p={6}
        position="relative"
        overflow="hidden"
      >
        <Box
          position="absolute"
          top="-50px"
          right="-50px"
          w="200px"
          h="200px"
          borderRadius="full"
          bg="blue.400"
          opacity="0.1"
          animation="float 6s ease-in-out infinite"
        />
        <Box
          position="absolute"
          bottom="-30px"
          left="-30px"
          w="150px"
          h="150px"
          borderRadius="full"
          bg="purple.400"
          opacity="0.1"
          animation="float 4s ease-in-out infinite reverse"
        />

        <Card
          maxW="lg"
          w="full"
          bg={cardBg}
          shadow="2xl"
          borderRadius="2xl"
          overflow="hidden"
          transform="scale(1)"
          transition="all 0.3s ease"
          _hover={{ transform: "scale(1.02)", shadow: "3xl" }}
        >
          <Box bgGradient={headerBg} p={8} textAlign="center">
            <VStack spacing={4}>
              <Avatar size="xl" bg="whiteAlpha.200" icon={<PhoneIcon fontSize="2xl" color="white" />} />
              <VStack spacing={2}>
                <Heading size="xl" color="white" fontWeight="bold">
                  Meus Agendamentos
                </Heading>
                <Text color="whiteAlpha.800" fontSize="lg">
                  Digite seu telefone para acessar
                </Text>
              </VStack>
            </VStack>
          </Box>

          <CardBody p={8}>
            <VStack spacing={6}>
              <FormControl isInvalid={!!erro}>
                <FormLabel fontSize="md" fontWeight="semibold" color={accentColor}>
                  Número de Telefone
                </FormLabel>
                <Input
                  type="tel"
                  placeholder="(11) 99999-9999"
                  value={telefone}
                  onChange={handleTelefoneChange}
                  maxLength={15}
                  size="lg"
                  borderRadius="xl"
                  focusBorderColor="purple.400"
                  _focus={{
                    borderColor: "purple.400",
                    boxShadow: "0 0 0 3px rgba(128, 90, 213, 0.1)",
                    transform: "scale(1.02)",
                  }}
                  transition="all 0.2s"
                />
                <FormErrorMessage fontSize="sm">{erro}</FormErrorMessage>
              </FormControl>

              <Button
                onClick={buscarAgendamentos}
                isLoading={carregando}
                loadingText="Buscando agendamentos..."
                bgGradient="linear(to-r, blue.500, purple.500)"
                color="white"
                size="lg"
                w="full"
                borderRadius="xl"
                leftIcon={<SearchIcon />}
                _hover={{
                  bgGradient: "linear(to-r, blue.600, purple.600)",
                  transform: "translateY(-2px)",
                  shadow: "lg",
                }}
                _active={{ transform: "translateY(0)" }}
                transition="all 0.2s"
                fontWeight="semibold"
              >
                Buscar Agendamentos
              </Button>
            </VStack>
          </CardBody>
        </Card>

        <style jsx>{`
          @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-20px); }
          }
        `}</style>
      </Box>
    )
  }

  return (
    <Box minH="100vh" bgGradient={bgGradient}>
      <Box bgGradient={headerBg} p={4} position="sticky" top={0} zIndex={50} shadow="lg" backdropFilter="blur(10px)">
        <Flex alignItems="center">
          <IconButton
            aria-label="Menu"
            icon={<HamburgerIcon />}
            onClick={onOpen}
            variant="ghost"
            mr={4}
            color="white"
            _hover={{ bg: "whiteAlpha.200" }}
            size="lg"
          />
          <VStack align="start" spacing={0}>
            <Heading size="lg" color="white">
              Agendamentos
            </Heading>
            <Text color="whiteAlpha.800" fontSize="sm">
              {telefone}
            </Text>
          </VStack>
          <Spacer />
          <Avatar size="md" bg="whiteAlpha.200" />
        </Flex>
      </Box>

      <Drawer isOpen={isOpen} placement="left" onClose={onClose}>
        <DrawerOverlay backdropFilter="blur(4px)" />
        <DrawerContent borderRadius="0 2xl 2xl 0">
          <DrawerCloseButton size="lg" />
          <DrawerHeader bgGradient={headerBg} color="white" borderRadius="0 2xl 0 0">
            <VStack align="start" spacing={2}>
              <Heading size="md">Menu</Heading>
              <Text fontSize="sm" opacity="0.8">
                Navegue pelas seções
              </Text>
            </VStack>
          </DrawerHeader>
          <DrawerBody p={6}>
            <VStack spacing={3} align="stretch">
              <Button
                leftIcon={<CalendarIcon />}
                variant={secaoAtiva === "agendamentos" ? "solid" : "ghost"}
                colorScheme="purple"
                justifyContent="flex-start"
                size="lg"
                borderRadius="xl"
                onClick={() => {
                  setSecaoAtiva("agendamentos")
                  onClose()
                }}
                _hover={{ transform: "translateX(4px)" }}
                transition="all 0.2s"
              >
                Agendamentos Atuais
              </Button>
              <Button
                leftIcon={<TimeIcon />}
                variant={secaoAtiva === "historico" ? "solid" : "ghost"}
                colorScheme="purple"
                justifyContent="flex-start"
                size="lg"
                borderRadius="xl"
                onClick={() => {
                  setSecaoAtiva("historico")
                  onClose()
                }}
                _hover={{ transform: "translateX(4px)" }}
                transition="all 0.2s"
              >
                Histórico
              </Button>
              <Button
                leftIcon={<StarIcon />}
                variant={secaoAtiva === "avaliacoes" ? "solid" : "ghost"}
                colorScheme="purple"
                justifyContent="flex-start"
                size="lg"
                borderRadius="xl"
                onClick={() => {
                  setSecaoAtiva("avaliacoes")
                  onClose()
                }}
                _hover={{ transform: "translateX(4px)" }}
                transition="all 0.2s"
              >
                Avaliações
              </Button>
            </VStack>

            <Divider my={6} />

            <VStack spacing={4} align="stretch">
              <Text fontSize="sm" fontWeight="semibold" color="gray.500" textTransform="uppercase">
                Resumo
              </Text>
              <SimpleGrid columns={1} spacing={3}>
                <Stat bg="blue.50" p={4} borderRadius="xl">
                  <StatLabel fontSize="xs">Próximos</StatLabel>
                  <StatNumber fontSize="2xl" color="blue.600">
                    {agendamentos.length}
                  </StatNumber>
                </Stat>
                <Stat bg="green.50" p={4} borderRadius="xl">
                  <StatLabel fontSize="xs">Concluídos</StatLabel>
                  <StatNumber fontSize="2xl" color="green.600">
                    {agendamentosAntigos.filter((a) => a.status === "concluido").length}
                  </StatNumber>
                </Stat>
              </SimpleGrid>
            </VStack>
          </DrawerBody>
        </DrawerContent>
      </Drawer>

      <Container maxW="4xl" p={6}>
        {/* Agendamentos Atuais */}
        {secaoAtiva === "agendamentos" && (
          <VStack spacing={6} align="stretch">
            <VStack align="start" spacing={2}>
              <Heading size="xl" bgGradient="linear(to-r, blue.500, purple.500)" bgClip="text">
                Próximos Agendamentos
              </Heading>
              <Text color="gray.500" fontSize="lg">
                Você tem {agendamentos.length} agendamentos confirmados
              </Text>
            </VStack>

            {agendamentos.map((agendamento, index) => (
              <Card
                key={agendamento.id}
                bg={cardBg}
                shadow="xl"
                borderRadius="2xl"
                overflow="hidden"
                _hover={{
                  shadow: "2xl",
                  transform: "translateY(-4px)",
                }}
                transition="all 0.3s ease"
                style={{
                  animation: `slideInUp 0.5s ease ${index * 0.1}s both`,
                }}
              >
                <CardBody p={6}>
                  <Flex justify="space-between" align="center" mb={4}>
                    <Badge
                      colorScheme={getStatusColor(agendamento.status)}
                      display="flex"
                      alignItems="center"
                      gap={2}
                      px={3}
                      py={1}
                      borderRadius="full"
                      fontSize="sm"
                    >
                      {getStatusIcon(agendamento.status)}
                      <Text textTransform="capitalize" fontWeight="semibold">
                        {agendamento.status}
                      </Text>
                    </Badge>
                    <ChevronRightIcon color="gray.400" fontSize="xl" />
                  </Flex>

                  <Heading size="lg" mb={4} color={accentColor}>
                    {agendamento.servico}
                  </Heading>

                  <SimpleGrid columns={2} spacing={4}>
                    <HStack spacing={3} p={3} bg="blue.50" borderRadius="xl">
                      <CalendarIcon color="blue.500" />
                      <VStack align="start" spacing={0}>
                        <Text fontSize="xs" color="gray.500" fontWeight="semibold">
                          DATA
                        </Text>
                        <Text fontWeight="semibold">{new Date(agendamento.data).toLocaleDateString("pt-BR")}</Text>
                      </VStack>
                    </HStack>
                    <HStack spacing={3} p={3} bg="purple.50" borderRadius="xl">
                      <TimeIcon color="purple.500" />
                      <VStack align="start" spacing={0}>
                        <Text fontSize="xs" color="gray.500" fontWeight="semibold">
                          HORÁRIO
                        </Text>
                        <Text fontWeight="semibold">{agendamento.hora}</Text>
                      </VStack>
                    </HStack>
                  </SimpleGrid>
                </CardBody>
              </Card>
            ))}
          </VStack>
        )}

        {/* Histórico */}
        {secaoAtiva === "historico" && (
          <VStack spacing={6} align="stretch">
            <VStack align="start" spacing={2}>
              <Heading size="xl" bgGradient="linear(to-r, blue.500, purple.500)" bgClip="text">
                Histórico de Agendamentos
              </Heading>
              <Text color="gray.500" fontSize="lg">
                Seus últimos {agendamentosAntigos.length} agendamentos
              </Text>
            </VStack>

            {agendamentosAntigos.map((agendamento, index) => (
              <Card
                key={agendamento.id}
                bg={cardBg}
                shadow="lg"
                borderRadius="2xl"
                style={{
                  animation: `slideInUp 0.5s ease ${index * 0.1}s both`,
                }}
              >
                <CardBody p={6}>
                  <Flex justify="space-between" align="center" mb={4}>
                    <Badge
                      colorScheme={getStatusColor(agendamento.status)}
                      display="flex"
                      alignItems="center"
                      gap={2}
                      px={3}
                      py={1}
                      borderRadius="full"
                    >
                      {getStatusIcon(agendamento.status)}
                      <Text textTransform="capitalize">{agendamento.status}</Text>
                    </Badge>
                    {agendamento.avaliacao && (
                      <HStack bg="yellow.50" px={3} py={1} borderRadius="full">
                        <StarIcon color="yellow.400" />
                        <Text fontSize="sm" fontWeight="semibold">
                          {agendamento.avaliacao}/5
                        </Text>
                      </HStack>
                    )}
                  </Flex>

                  <Heading size="md" mb={4} color={accentColor}>
                    {agendamento.servico}
                  </Heading>

                  <SimpleGrid columns={2} spacing={4}>
                    <HStack spacing={3} p={3} bg="gray.50" borderRadius="xl">
                      <CalendarIcon color="gray.500" />
                      <Text fontWeight="semibold">{new Date(agendamento.data).toLocaleDateString("pt-BR")}</Text>
                    </HStack>
                    <HStack spacing={3} p={3} bg="gray.50" borderRadius="xl">
                      <TimeIcon color="gray.500" />
                      <Text fontWeight="semibold">{agendamento.hora}</Text>
                    </HStack>
                  </SimpleGrid>
                </CardBody>
              </Card>
            ))}
          </VStack>
        )}

        {/* Avaliações */}
        {secaoAtiva === "avaliacoes" && (
          <VStack spacing={6} align="stretch">
            <VStack align="start" spacing={2}>
              <Heading size="xl" bgGradient="linear(to-r, blue.500, purple.500)" bgClip="text">
                Avaliar Atendimentos
              </Heading>
              <Text color="gray.500" fontSize="lg">
                Sua opinião é muito importante para nós
              </Text>
            </VStack>

            {agendamentosAntigos
              .filter((a) => a.status === "concluido")
              .map((agendamento, index) => (
                <Card
                  key={agendamento.id}
                  bg={cardBg}
                  shadow="lg"
                  borderRadius="2xl"
                  style={{
                    animation: `slideInUp 0.5s ease ${index * 0.1}s both`,
                  }}
                >
                  <CardBody p={6}>
                    <Heading size="md" mb={2} color={accentColor}>
                      {agendamento.servico}
                    </Heading>

                    <SimpleGrid columns={2} spacing={4} mb={6}>
                      <HStack spacing={3} p={3} bg="gray.50" borderRadius="xl">
                        <CalendarIcon color="gray.500" />
                        <Text fontWeight="semibold">{new Date(agendamento.data).toLocaleDateString("pt-BR")}</Text>
                      </HStack>
                      <HStack spacing={3} p={3} bg="gray.50" borderRadius="xl">
                        <TimeIcon color="gray.500" />
                        <Text fontWeight="semibold">{agendamento.hora}</Text>
                      </HStack>
                    </SimpleGrid>

                    <VStack align="start" spacing={4}>
                      <Text fontSize="md" fontWeight="semibold" color={accentColor}>
                        {agendamento.avaliacao ? "Sua avaliação:" : "Como foi seu atendimento?"}
                      </Text>
                      <Box p={4} bg="yellow.50" borderRadius="xl" w="full">
                        {renderStars(agendamento.id, agendamento.avaliacao)}
                      </Box>
                      {avaliacaoSelecionada[agendamento.id] && !agendamento.avaliacao && (
                        <Button
                          size="md"
                          bgGradient="linear(to-r, blue.500, purple.500)"
                          color="white"
                          borderRadius="xl"
                          _hover={{
                            bgGradient: "linear(to-r, blue.600, purple.600)",
                            transform: "translateY(-2px)",
                          }}
                          transition="all 0.2s"
                        >
                          Enviar Avaliação
                        </Button>
                      )}
                    </VStack>
                  </CardBody>
                </Card>
              ))}
          </VStack>
        )}
      </Container>

      <style jsx>{`
        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </Box>
  )
}
