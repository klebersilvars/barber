"use client"

import { useState, useEffect } from "react"
import { collection, getDocs, deleteDoc, doc as firestoreDoc } from 'firebase/firestore'
import { firestore } from '../../../firebase/firebase'
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
  Input,
  Textarea,
  Checkbox,
  DrawerBody,
  DrawerHeader,
  DrawerCloseButton,
  Select,
} from "@chakra-ui/react"
import { BellIcon, ChevronDownIcon } from "@chakra-ui/icons"
import { FiHome, FiSettings, FiMenu, FiDollarSign, FiLogOut, FiShoppingBag } from "react-icons/fi"
import { signOut } from "firebase/auth"
import { auth } from "../../../firebase/firebase"
import { useNavigate } from "react-router-dom"
import { useToast } from '@chakra-ui/react'
import { updateDoc } from 'firebase/firestore'

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

const EstablishmentsContent = () => {
  const [estabelecimentos, setEstabelecimentos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<any | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showRemoveModal, setShowRemoveModal] = useState(false)
  const [removing, setRemoving] = useState(false)
  const [editLoading, setEditLoading] = useState(false)
  const [editData, setEditData] = useState<any | null>(null)
  const toast = useToast()

  useEffect(() => {
    const fetchEstabs = async () => {
      setLoading(true)
      const snap = await getDocs(collection(firestore, 'contas'))
      setEstabelecimentos(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })))
      setLoading(false)
    }
    fetchEstabs()
  }, [])

  // Preencher editData ao abrir modal
  useEffect(() => {
    if (showEditModal && selected) {
      setEditData({ ...selected })
    }
  }, [showEditModal, selected])

  const handleRemove = async () => {
    if (!selected) return
    setRemoving(true)
    try {
      await deleteDoc(firestoreDoc(firestore, 'contas', selected.id))
      setEstabelecimentos(estabelecimentos.filter(e => e.id !== selected.id))
      setShowRemoveModal(false)
      setSelected(null)
    } finally {
      setRemoving(false)
    }
  }

  const handleEditChange = (field: string, value: any) => {
    setEditData((prev: any) => ({ ...prev, [field]: value }))
  }

  const handleEditSave = async () => {
    if (!editData || !editData.id) return
    setEditLoading(true)
    try {
      const docRef = firestoreDoc(firestore, 'contas', editData.id)
      const updateObj: any = {
        nomeEstabelecimento: editData.nomeEstabelecimento || '',
        nome: editData.nome || '',
        email: editData.email || '',
        telefone: editData.telefone || '',
        rua: editData.rua || '',
        numero: editData.numero || '',
        bairro: editData.bairro || '',
        cidade: editData.cidade || '',
        estado: editData.estado || '',
        cep: editData.cep || '',
        complemento: editData.complemento || '',
        descricaoEstabelecimento: editData.descricaoEstabelecimento || '',
        premium: editData.premium,
        tipoPlano: editData.tipoPlano,
        slug: editData.slug,
        avaliacao_gratis: editData.avaliacao_gratis,
        aparenciaAgendamento: {
          corPrincipal: editData.aparenciaAgendamento?.corPrincipal || '',
          nomeExibicao: editData.aparenciaAgendamento?.nomeExibicao || '',
          linkAgendamento: editData.aparenciaAgendamento?.linkAgendamento || '',
          mensagemBoasVindas: editData.aparenciaAgendamento?.mensagemBoasVindas || '',
          mensagemAgradecimento: editData.aparenciaAgendamento?.mensagemAgradecimento || '',
        },
        configuracoesAtendimento: {
          appointmentInterval: editData.configuracoesAtendimento?.appointmentInterval || 15,
          maxAppointmentsPerDay: editData.configuracoesAtendimento?.maxAppointmentsPerDay || 8,
        },
        politicas: {
          cancellationHours: editData.politicas?.cancellationHours || 24,
          cancellationPolicy: editData.politicas?.cancellationPolicy || '',
          rescheduleHours: editData.politicas?.rescheduleHours || 12,
          reschedulePolicy: editData.politicas?.reschedulePolicy || '',
        },
        horariosFunc: editData.horariosFunc || [],
      }
      const agora = new Date();
      // Lógica de atualização de premium/plano
      if ((editData.tipoPlano === 'individual' || editData.tipoPlano === 'empresa') && editData.premium) {
        // Ativar premium por 30 dias
        updateObj.premium = true;
        updateObj.tipoPlano = editData.tipoPlano;
        updateObj.data_inicio_teste_gratis = agora.toISOString();
        const fim = new Date(agora);
        fim.setDate(fim.getDate() + 30);
        updateObj.data_fim_teste_gratis = fim.toISOString();
        updateObj.avaliacao_gratis = false;
        updateObj.dias_plano_pago = 30;
        updateObj.dias_plano_pago_restante = 30;
      } else if (editData.avaliacao_gratis && (!editData.tipoPlano || editData.tipoPlano === '')) {
        // Se marcar avaliação grátis e não tiver plano, dar 7 dias de premium grátis
        updateObj.premium = true;
        updateObj.tipoPlano = '';
        updateObj.data_inicio_teste_gratis = agora.toISOString();
        const fim = new Date(agora);
        fim.setDate(fim.getDate() + 7);
        updateObj.data_fim_teste_gratis = fim.toISOString();
        // Não preenche dias_plano_pago
      } else if ((!editData.tipoPlano || editData.tipoPlano === '') && !editData.premium) {
        // Remover premium imediatamente
        updateObj.premium = false;
        updateObj.tipoPlano = '';
        updateObj.data_inicio_teste_gratis = null;
        updateObj.data_fim_teste_gratis = null;
        updateObj.avaliacao_gratis = false;
        updateObj.dias_plano_pago = 0;
        updateObj.dias_plano_pago_restante = 0;
      }
      await updateDoc(docRef, updateObj)
      setEstabelecimentos(estabelecimentos.map(e => e.id === editData.id ? { ...e, ...updateObj } : e))
      setShowEditModal(false)
      setSelected(null)
      toast({ title: 'Estabelecimento atualizado!', status: 'success', duration: 2500, isClosable: true })
    } catch (err) {
      console.log('Erro ao atualizar estabelecimento:', err)
      toast({ title: 'Erro ao atualizar', status: 'error', duration: 3000, isClosable: true })
    } finally {
      setEditLoading(false)
    }
  }

  return (
    <Box>
      <Flex justify="space-between" align="center" mb={6}>
        <Heading size="lg">Estabelecimentos</Heading>
      </Flex>
      <Card>
        <CardBody>
          <TableContainer>
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th>Nome</Th>
                  <Th>Plano</Th>
                  <Th>Status</Th>
                  <Th>Dias Restantes</Th>
                  <Th>Email</Th>
                  <Th>Ações</Th>
                </Tr>
              </Thead>
              <Tbody>
                {loading ? (
                  <Tr><Td colSpan={6}>Carregando...</Td></Tr>
                ) : estabelecimentos.length === 0 ? (
                  <Tr><Td colSpan={6}>Nenhum estabelecimento encontrado</Td></Tr>
                ) : (
                  estabelecimentos.map(estab => (
                    <Tr key={estab.id}>
                      <Td>{estab.nomeEstabelecimento || '-'}</Td>
                      <Td>{estab.tipoPlano === 'individual' ? 'Individual' : estab.tipoPlano === 'empresa' ? 'Empresa' : 'Nenhum'}</Td>
                      <Td>
                        {estab.premium ? (
                          <Badge colorScheme="green">Premium</Badge>
                        ) : estab.data_inicio_teste_gratis ? (
                          <Badge colorScheme="yellow">Teste Grátis</Badge>
                        ) : (
                          <Badge colorScheme="red">Inativo</Badge>
                        )}
                      </Td>
                      <Td>
                        {estab.tipoPlano === 'individual' || estab.tipoPlano === 'empresa'
                          ? (estab.dias_plano_pago_restante ?? '-')
                          : (estab.data_inicio_teste_gratis ? (7 - Math.floor((new Date().getTime() - new Date(estab.data_inicio_teste_gratis).getTime()) / (1000 * 60 * 60 * 24))) : '-')
                        }
                      </Td>
                      <Td>{estab.email}</Td>
                      <Td>
                        <HStack spacing={2}>
                          <Button size="xs" variant="outline" onClick={() => { setSelected(estab); setShowEditModal(true); }}>Editar</Button>
                          <Button size="xs" variant="outline" colorScheme="red" onClick={() => { setSelected(estab); setShowRemoveModal(true); }}>Remover</Button>
                        </HStack>
                      </Td>
                    </Tr>
                  ))
                )}
              </Tbody>
            </Table>
          </TableContainer>
        </CardBody>
      </Card>

      {/* Modal de Remover */}
      <Drawer isOpen={showRemoveModal} placement="bottom" onClose={() => setShowRemoveModal(false)} size="xs">
        <DrawerContent p={4}>
          <VStack spacing={4} align="center" p={4}>
            <Heading size="md">Remover Estabelecimento</Heading>
            <Text>Tem certeza que deseja remover <b>{selected?.nomeEstabelecimento}</b>? Esta ação é irreversível.</Text>
            <HStack>
              <Button onClick={() => setShowRemoveModal(false)} variant="outline">Cancelar</Button>
              <Button colorScheme="red" isLoading={removing} onClick={handleRemove}>Remover</Button>
            </HStack>
          </VStack>
        </DrawerContent>
      </Drawer>

      {/* Modal de Editar */}
      <Drawer isOpen={showEditModal} placement="bottom" onClose={() => setShowEditModal(false)} size="xs">
        <DrawerContent p={0} maxH="90vh" borderTopRadius="2xl" overflow="hidden">
          <DrawerCloseButton top={2} right={2} onClick={() => setShowEditModal(false)} />
          <DrawerHeader borderBottomWidth="1px" p={4} fontSize="lg" fontWeight="bold">Editar Estabelecimento</DrawerHeader>
          <DrawerBody p={0} maxH="calc(90vh - 56px)" overflowY="auto">
            <Box p={4}>
              <VStack spacing={4} align="stretch">
                {editData && (
                  <>
                    {/* Dados básicos */}
                    <Heading size="sm" mt={2}>Dados Básicos</Heading>
                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={2}>
                      <Input placeholder="Nome do Estabelecimento" value={editData.nomeEstabelecimento || ''} onChange={e => handleEditChange('nomeEstabelecimento', e.target.value)} />
                      <Input placeholder="Nome do Responsável" value={editData.nome || ''} onChange={e => handleEditChange('nome', e.target.value)} />
                      <Input placeholder="Email" value={editData.email || ''} onChange={e => handleEditChange('email', e.target.value)} />
                      <Input placeholder="Telefone" value={editData.telefone || ''} onChange={e => handleEditChange('telefone', e.target.value)} />
                      <Input placeholder="Slug" value={editData.slug || ''} onChange={e => handleEditChange('slug', e.target.value)} />
                    </SimpleGrid>
                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={2}>
                      <Input placeholder="Rua" value={editData.rua || ''} onChange={e => handleEditChange('rua', e.target.value)} />
                      <Input placeholder="Número" value={editData.numero || ''} onChange={e => handleEditChange('numero', e.target.value)} />
                      <Input placeholder="Bairro" value={editData.bairro || ''} onChange={e => handleEditChange('bairro', e.target.value)} />
                      <Input placeholder="Cidade" value={editData.cidade || ''} onChange={e => handleEditChange('cidade', e.target.value)} />
                      <Input placeholder="Estado" value={editData.estado || ''} onChange={e => handleEditChange('estado', e.target.value)} />
                      <Input placeholder="CEP" value={editData.cep || ''} onChange={e => handleEditChange('cep', e.target.value)} />
                      <Input placeholder="Complemento" value={editData.complemento || ''} onChange={e => handleEditChange('complemento', e.target.value)} />
                    </SimpleGrid>
                    <Textarea placeholder="Descrição do Estabelecimento" value={editData.descricaoEstabelecimento || ''} onChange={e => handleEditChange('descricaoEstabelecimento', e.target.value)} />

                    {/* Aparência */}
                    <Heading size="sm" mt={4}>Aparência e Identidade</Heading>
                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={2}>
                      <Input placeholder="Cor Principal" value={editData.aparenciaAgendamento?.corPrincipal || ''} onChange={e => setEditData((prev: any) => ({ ...prev, aparenciaAgendamento: { ...prev.aparenciaAgendamento, corPrincipal: e.target.value } }))} />
                      <Input placeholder="Nome de Exibição" value={editData.aparenciaAgendamento?.nomeExibicao || ''} onChange={e => setEditData((prev: any) => ({ ...prev, aparenciaAgendamento: { ...prev.aparenciaAgendamento, nomeExibicao: e.target.value } }))} />
                      <Input placeholder="Link de Agendamento" value={editData.aparenciaAgendamento?.linkAgendamento || ''} onChange={e => setEditData((prev: any) => ({ ...prev, aparenciaAgendamento: { ...prev.aparenciaAgendamento, linkAgendamento: e.target.value } }))} />
                    </SimpleGrid>
                    <Textarea placeholder="Mensagem de Boas-vindas" value={editData.aparenciaAgendamento?.mensagemBoasVindas || ''} onChange={e => setEditData((prev: any) => ({ ...prev, aparenciaAgendamento: { ...prev.aparenciaAgendamento, mensagemBoasVindas: e.target.value } }))} />
                    <Textarea placeholder="Mensagem de Agradecimento" value={editData.aparenciaAgendamento?.mensagemAgradecimento || ''} onChange={e => setEditData((prev: any) => ({ ...prev, aparenciaAgendamento: { ...prev.aparenciaAgendamento, mensagemAgradecimento: e.target.value } }))} />

                    {/* Configurações de Atendimento */}
                    <Heading size="sm" mt={4}>Configurações de Atendimento</Heading>
                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={2}>
                      <Input type="number" placeholder="Intervalo entre atendimentos (min)" value={editData.configuracoesAtendimento?.appointmentInterval || 15} onChange={e => setEditData((prev: any) => ({ ...prev, configuracoesAtendimento: { ...prev.configuracoesAtendimento, appointmentInterval: Number(e.target.value) } }))} />
                      <Input type="number" placeholder="Máx. atendimentos/dia" value={editData.configuracoesAtendimento?.maxAppointmentsPerDay || 8} onChange={e => setEditData((prev: any) => ({ ...prev, configuracoesAtendimento: { ...prev.configuracoesAtendimento, maxAppointmentsPerDay: Number(e.target.value) } }))} />
                    </SimpleGrid>

                    {/* Políticas */}
                    <Heading size="sm" mt={4}>Políticas</Heading>
                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={2}>
                      <Input type="number" placeholder="Horas para cancelar" value={editData.politicas?.cancellationHours || 24} onChange={e => setEditData((prev: any) => ({ ...prev, politicas: { ...prev.politicas, cancellationHours: Number(e.target.value) } }))} />
                      <Input type="number" placeholder="Horas para remarcar" value={editData.politicas?.rescheduleHours || 12} onChange={e => setEditData((prev: any) => ({ ...prev, politicas: { ...prev.politicas, rescheduleHours: Number(e.target.value) } }))} />
                    </SimpleGrid>
                    <Textarea placeholder="Política de Cancelamento" value={editData.politicas?.cancellationPolicy || ''} onChange={e => setEditData((prev: any) => ({ ...prev, politicas: { ...prev.politicas, cancellationPolicy: e.target.value } }))} />
                    <Textarea placeholder="Política de Remarcação" value={editData.politicas?.reschedulePolicy || ''} onChange={e => setEditData((prev: any) => ({ ...prev, politicas: { ...prev.politicas, reschedulePolicy: e.target.value } }))} />

                    {/* Status premium e plano */}
                    <Heading size="sm" mt={4}>Plano e Status</Heading>
                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={2}>
                      <Select placeholder="Selecione o tipo de plano" value={editData.tipoPlano || ''} onChange={e => {
                        const value = e.target.value;
                        handleEditChange('tipoPlano', value);
                      }}>
                        <option value="">Nenhum</option>
                        <option value="individual">Individual</option>
                        <option value="empresa">Empresa</option>
                      </Select>
                      <Box>
                        <Text fontSize="sm" mb={1} fontWeight="semibold">Status Premium</Text>
                        <Select value={editData.premium ? 'ativado' : 'desativado'} onChange={e => {
                          const value = e.target.value === 'ativado';
                          handleEditChange('premium', value);
                        }}>
                          <option value="ativado">Ativado</option>
                          <option value="desativado">Desativado</option>
                        </Select>
                      </Box>
                    </SimpleGrid>
                    <Checkbox isChecked={editData.avaliacao_gratis} onChange={e => handleEditChange('avaliacao_gratis', e.target.checked)}>Avaliação Grátis</Checkbox>

                    <Button colorScheme="blue" isLoading={editLoading} onClick={handleEditSave}>Salvar Alterações</Button>
                  </>
                )}
                <Button onClick={() => setShowEditModal(false)} variant="outline">Fechar</Button>
              </VStack>
            </Box>
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </Box>
  )
}

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
