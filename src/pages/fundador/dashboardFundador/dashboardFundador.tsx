"use client"

import { useState } from "react"
import {
  Box,
  Flex,
  Text,
  IconButton,
  Avatar,
  HStack,
  VStack,
  Drawer,
  DrawerContent,
  useDisclosure,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  Button,
  useColorModeValue,
  Heading,
  Grid,
  Card,
  CardBody,
  CardHeader,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Badge,
  Progress,
  SimpleGrid,
} from "@chakra-ui/react"
import { BellIcon, ChevronDownIcon } from "@chakra-ui/icons"
import { FiHome, FiSettings, FiMenu, FiDollarSign, FiLogOut, FiShoppingBag } from "react-icons/fi"
import { signOut } from "firebase/auth"
import { auth } from "../../../firebase/firebase"
import { useNavigate } from "react-router-dom"

interface SidebarProps {
  onClose: () => void
  activeSection: string
  setActiveSection: (section: string) => void
}

const SidebarContent = ({ onClose, activeSection, setActiveSection }: SidebarProps) => {
  const menuItems = [
    { name: "Dashboard", icon: FiHome, section: "dashboard" },
    { name: "Estabelecimentos", icon: FiShoppingBag, section: "establishments" },
    { name: "Financeiro", icon: FiDollarSign, section: "financial" },
    { name: "Configurações", icon: FiSettings, section: "settings" },
  ]

  const navigation = useNavigate();
  async function sairDaContaFundador() {
    await signOut(auth)
    .then(()=> {
        navigation('/fundador')
    })
    .catch((error)=> {
        alert('Erro ao sair da conta, tente mais tarde!')
        console.log(error)
    })
  }

  return (
    <Box
      bg={useColorModeValue("white", "gray.900")}
      borderRight="1px"
      borderRightColor={useColorModeValue("gray.200", "gray.700")}
      w={{ base: "full", md: 60 }}
      pos="fixed"
      h="full"
    >
      <Flex h="20" alignItems="center" mx="8" justifyContent="space-between">
        <Text fontSize="2xl" fontFamily="monospace" fontWeight="bold" color="blue.500">
          AdminPanel
        </Text>
      </Flex>
      <VStack align="stretch" spacing={1} px={4}>
        {menuItems.map((item) => (
          <Button
            key={item.name}
            leftIcon={<item.icon />}
            variant={activeSection === item.section ? "solid" : "ghost"}
            colorScheme={activeSection === item.section ? "blue" : "gray"}
            justifyContent="flex-start"
            onClick={() => {
              setActiveSection(item.section)
              onClose()
            }}
          >
            {item.name}
          </Button>
        ))}
        <Box pt={8}>
          <Button
            leftIcon={<FiLogOut />}
            variant="ghost"
            colorScheme="red"
            justifyContent="flex-start"
            w="full"
            onClick={sairDaContaFundador}
          >
            Sair da Conta
          </Button>
        </Box>
      </VStack>
    </Box>
  )
}

const MobileNav = ({ onOpen, ...rest }: { onOpen: () => void }) => {
  return (
    <Flex
      ml={{ base: 0, md: 60 }}
      px={{ base: 4, md: 4 }}
      height="20"
      alignItems="center"
      bg={useColorModeValue("white", "gray.900")}
      borderBottomWidth="1px"
      borderBottomColor={useColorModeValue("gray.200", "gray.700")}
      justifyContent={{ base: "space-between", md: "flex-end" }}
      {...rest}
    >
      <IconButton
        display={{ base: "flex", md: "none" }}
        onClick={onOpen}
        variant="outline"
        aria-label="open menu"
        icon={<FiMenu />}
      />

      <Text
        display={{ base: "flex", md: "none" }}
        fontSize="2xl"
        fontFamily="monospace"
        fontWeight="bold"
        color="blue.500"
      >
        AdminPanel
      </Text>

      <HStack spacing={{ base: "0", md: "6" }}>
        <IconButton size="lg" variant="ghost" aria-label="notifications" icon={<BellIcon />} />
        <Flex alignItems="center">
          <Menu>
            <MenuButton py={2} transition="all 0.3s" _focus={{ boxShadow: "none" }}>
              <HStack>
                <Avatar
                  size="sm"
                  src="https://images.unsplash.com/photo-1619946794135-5bc917a27793?ixlib=rb-0.3.5&q=80&fm=jpg&crop=faces&fit=crop&h=200&w=200&s=b616b2c5b373a80ffc9636ba24f7a4a9"
                />
                <VStack display={{ base: "none", md: "flex" }} alignItems="flex-start" spacing="1px" ml="2">
                  <Text fontSize="sm">João Silva</Text>
                  <Text fontSize="xs" color="gray.600">
                    Fundador
                  </Text>
                </VStack>
                <Box display={{ base: "none", md: "flex" }}>
                  <ChevronDownIcon />
                </Box>
              </HStack>
            </MenuButton>
            <MenuList>
              <MenuItem>Perfil</MenuItem>
              <MenuItem>Configurações</MenuItem>
              <MenuDivider />
              <MenuItem color="red.500">Sair</MenuItem>
            </MenuList>
          </Menu>
        </Flex>
      </HStack>
    </Flex>
  )
}

const DashboardContent = () => (
  <Box>
    <Heading size="lg" mb={6}>
      Painel Geral da Plataforma CliqAgenda
    </Heading>
    <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6} mb={8}>
      <Card>
        <CardBody>
          <Stat>
            <StatLabel>Estabelecimentos Premium</StatLabel>
            <StatNumber>+ de 100 ativos</StatNumber>
            <StatHelpText>
              <StatArrow type="increase" />
              Controle de planos (Individual/Empresa)
            </StatHelpText>
          </Stat>
        </CardBody>
      </Card>
      <Card>
        <CardBody>
          <Stat>
            <StatLabel>Gestão de Premium</StatLabel>
            <StatNumber>30 dias por ciclo</StatNumber>
            <StatHelpText>
              <StatArrow type="increase" />
              Upgrade automático após pagamento
            </StatHelpText>
          </Stat>
        </CardBody>
      </Card>
      <Card>
        <CardBody>
          <Stat>
            <StatLabel>Diferenciais</StatLabel>
            <StatNumber>Barbearias & Salões</StatNumber>
            <StatHelpText>
              <StatArrow type="increase" />
              Agendamento, vendas, despesas, colaboradores
            </StatHelpText>
          </Stat>
        </CardBody>
      </Card>
      <Card>
        <CardBody>
          <Stat>
            <StatLabel>Controle de Acesso</StatLabel>
            <StatNumber>Planos & Permissões</StatNumber>
            <StatHelpText>
              <StatArrow type="increase" />
              Páginas liberadas conforme plano
            </StatHelpText>
          </Stat>
        </CardBody>
      </Card>
    </SimpleGrid>

    <Grid templateColumns={{ base: "1fr", lg: "2fr 1fr" }} gap={6}>
      <Card>
        <CardHeader>
          <Heading size="md">Últimas ações administrativas</Heading>
        </CardHeader>
        <CardBody>
          <TableContainer>
            <Table variant="simple" size="sm">
              <Thead>
                <Tr>
                  <Th>Estabelecimento</Th>
                  <Th>Plano</Th>
                  <Th>Status</Th>
                  <Th>Última ação</Th>
                </Tr>
              </Thead>
              <Tbody>
                {/* Exemplo de linha administrativa */}
                <Tr>
                  <Td>Barbearia Exemplo</Td>
                  <Td>Empresa</Td>
                  <Td><Badge colorScheme="green">Premium</Badge></Td>
                  <Td>Pagamento aprovado</Td>
                </Tr>
                <Tr>
                  <Td>Salão da Ana</Td>
                  <Td>Individual</Td>
                  <Td><Badge colorScheme="yellow">Teste Grátis</Badge></Td>
                  <Td>Teste ativado</Td>
                </Tr>
              </Tbody>
            </Table>
          </TableContainer>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <Heading size="md">Resumo do Sistema</Heading>
        </CardHeader>
        <CardBody>
          <VStack spacing={4} align="stretch">
            <Box>
              <Text fontSize="sm" mb={2}>
                Planos ativos, upgrades e permissões são controlados automaticamente pelo sistema.
              </Text>
              <Progress value={90} colorScheme="blue" />
              <Text fontSize="xs" color="gray.500" mt={1}>
                90% dos estabelecimentos utilizam recursos premium
              </Text>
            </Box>
            <Box>
              <Text fontSize="sm" mb={2}>
                Teste grátis de 7 dias disponível para novos estabelecimentos.
              </Text>
              <Progress value={100} colorScheme="green" />
              <Text fontSize="xs" color="gray.500" mt={1}>
                100% dos testes grátis convertem para premium
              </Text>
            </Box>
            <Box>
              <Text fontSize="sm" mb={2}>
                Gestão de agenda, vendas, despesas e colaboradores integrada.
              </Text>
              <Progress value={80} colorScheme="purple" />
              <Text fontSize="xs" color="gray.500" mt={1}>
                Plataforma focada em barbearias e salões de beleza
              </Text>
            </Box>
          </VStack>
        </CardBody>
      </Card>
    </Grid>
  </Box>
)

const EstablishmentsContent = () => (
  <Box>
    <Flex justify="space-between" align="center" mb={6}>
      <Heading size="lg">Estabelecimentos</Heading>
      <Button colorScheme="blue" size="sm">
        Adicionar Estabelecimento
      </Button>
    </Flex>
    <Card>
      <CardBody>
        <TableContainer>
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>Nome</Th>
                <Th>Plano</Th>
                <Th>Valor do plano</Th>
                <Th>Status</Th>
                <Th>Ações</Th>
              </Tr>
            </Thead>
            <Tbody>
              {/* Exemplo de estabelecimentos com planos e status */}
              <Tr>
                <Td>Barbearia Exemplo</Td>
                <Td>Empresa</Td>
                <Td>R$ 20,00</Td>
                <Td><Badge colorScheme="green">Premium</Badge></Td>
                <Td>
                  <HStack spacing={2}>
                    <Button size="xs" variant="outline">Editar</Button>
                    <Button size="xs" variant="outline" colorScheme="red">Remover</Button>
                  </HStack>
                </Td>
              </Tr>
              <Tr>
                <Td>Salão da Ana</Td>
                <Td>Individual</Td>
                <Td>R$ 10,00</Td>
                <Td><Badge colorScheme="yellow">Teste Grátis</Badge></Td>
                <Td>
                  <HStack spacing={2}>
                    <Button size="xs" variant="outline">Editar</Button>
                    <Button size="xs" variant="outline" colorScheme="red">Remover</Button>
                  </HStack>
                </Td>
              </Tr>
              <Tr>
                <Td>Pizzaria Napoli</Td>
                <Td>Empresa</Td>
                <Td>R$ 20,00</Td>
                <Td><Badge colorScheme="red">Inadimplente</Badge></Td>
                <Td>
                  <HStack spacing={2}>
                    <Button size="xs" variant="outline">Editar</Button>
                    <Button size="xs" variant="outline" colorScheme="red">Remover</Button>
                  </HStack>
                </Td>
              </Tr>
            </Tbody>
          </Table>
        </TableContainer>
      </CardBody>
    </Card>
  </Box>
)

const FinancialContent = () => (
  <Box>
    <Heading size="lg" mb={6}>
      Gestão Financeira
    </Heading>
    <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6} mb={8}>
      <Card>
        <CardBody>
          <Stat>
            <StatLabel>Receita Bruta</StatLabel>
            <StatNumber>R$ 0</StatNumber>
            <StatHelpText>Este mês</StatHelpText>
          </Stat>
        </CardBody>
      </Card>
      <Card>
      </Card>
      <Card>
        <CardBody>
          
        </CardBody>
      </Card>
    </SimpleGrid>

    <Card>
      <CardHeader>
        <Heading size="md">Relatório Financeiro Detalhado</Heading>
      </CardHeader>
      <CardBody>
        <TableContainer>
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>Estabelecimento</Th>
                <Th>Plano</Th>
                <Th>Valor do plano</Th>
                <Th>Status</Th>
              </Tr>
            </Thead>
            <Tbody>
              <Tr>
                <Td>Barbearia Exemplo</Td>
                <Td>Empresa</Td>
                <Td>R$ 20,00</Td>
                <Td><Badge colorScheme="green">Pago</Badge></Td>
                
              </Tr>
              <Tr>
                <Td>Salão da Ana</Td>
                <Td>Individual</Td>
                <Td>R$ 10,00</Td>
                <Td><Badge colorScheme="yellow">Teste Grátis</Badge></Td>
              </Tr>
              <Tr>
                <Td>Pizzaria Napoli</Td>
                <Td>Empresa</Td>
                <Td>R$ 20,00</Td>
                <Td><Badge colorScheme="red">Inadimplente</Badge></Td>
              </Tr>
            </Tbody>
          </Table>
        </TableContainer>
      </CardBody>
    </Card>
  </Box>
)

const SettingsContent = () => (
  <Box>
    <Heading size="lg" mb={6}>
      Configurações da Plataforma
    </Heading>
    <VStack spacing={6} align="stretch">
      <Card>
        <CardHeader>
          <Heading size="md">Configurações Gerais</Heading>
        </CardHeader>
        <CardBody>
          <VStack spacing={4} align="stretch">
            <Box>
              <Text fontWeight="semibold" mb={2}>
                Taxa da Plataforma
              </Text>
              <Text fontSize="sm" color="gray.600">
                Taxa atual: 5% sobre todas as transações
              </Text>
              <Button size="sm" mt={2} variant="outline">
                Alterar Taxa
              </Button>
            </Box>
            <Box>
              <Text fontWeight="semibold" mb={2}>
                Notificações
              </Text>
              <Text fontSize="sm" color="gray.600">
                Configurar alertas e notificações do sistema
              </Text>
              <Button size="sm" mt={2} variant="outline">
                Configurar
              </Button>
            </Box>
            <Box>
              <Text fontWeight="semibold" mb={2}>
                Backup de Dados
              </Text>
              <Text fontSize="sm" color="gray.600">
                Último backup: Hoje às 03:00
              </Text>
              <Button size="sm" mt={2} variant="outline">
                Fazer Backup
              </Button>
            </Box>
          </VStack>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <Heading size="md">Segurança</Heading>
        </CardHeader>
        <CardBody>
          <VStack spacing={4} align="stretch">
            <Box>
              <Text fontWeight="semibold" mb={2}>
                Autenticação de Dois Fatores
              </Text>
              <Text fontSize="sm" color="gray.600">
                Adicione uma camada extra de segurança
              </Text>
              <Button size="sm" mt={2} colorScheme="blue">
                Ativar 2FA
              </Button>
            </Box>
            <Box>
              <Text fontWeight="semibold" mb={2}>
                Logs de Acesso
              </Text>
              <Text fontSize="sm" color="gray.600">
                Visualizar histórico de acessos ao sistema
              </Text>
              <Button size="sm" mt={2} variant="outline">
                Ver Logs
              </Button>
            </Box>
          </VStack>
        </CardBody>
      </Card>
    </VStack>
  </Box>
)

export default function DashboardFundador() {
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [activeSection, setActiveSection] = useState("dashboard")

  const renderContent = () => {
    switch (activeSection) {
      case "establishments":
        return <EstablishmentsContent />
      case "financial":
        return <FinancialContent />
      case "settings":
        return <SettingsContent />
      default:
        return <DashboardContent />
    }
  }

  return (
    <Box minH="100vh" bg={useColorModeValue("gray.100", "gray.900")}>
      <SidebarContent
        onClose={() => onClose}
        activeSection={activeSection}
        setActiveSection={setActiveSection}
      />
      <Drawer
        autoFocus={false}
        isOpen={isOpen}
        placement="left"
        onClose={onClose}
        returnFocusOnClose={false}
        onOverlayClick={onClose}
        size="full"
      >
        <DrawerContent>
          <SidebarContent onClose={onClose} activeSection={activeSection} setActiveSection={setActiveSection} />
        </DrawerContent>
      </Drawer>
      <MobileNav onOpen={onOpen} />
      <Box ml={{ base: 0, md: 60 }} p="4">
        {renderContent()}
      </Box>
    </Box>
  )
}
