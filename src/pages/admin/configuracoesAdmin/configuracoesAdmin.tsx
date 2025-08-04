"use client"

import { useState, useEffect, useRef } from "react"
import {
  Building2,
  Clock,
  Palette,
  Settings,
  Save,
  Camera,
  Upload,
  Trash2,
  Phone,
  Mail,
  Globe,
} from "lucide-react"
import {
  Box,
  Button,
  Text,
  VStack,
  HStack,
  Icon,
  Input,
  InputGroup,
  InputLeftElement,
  Textarea,
  Select,
  Badge,
  Flex,
  Container,
  Heading,
  FormControl,
  FormLabel,
  FormHelperText,
  Card,
  CardBody,
  CardHeader,
  SimpleGrid,
  Spinner,
  useColorModeValue,
  Switch,
  Image,
  Center,
} from "@chakra-ui/react"
import "./configuracoesAdmin.css"
import { firestore, auth } from '../../../firebase/firebase'
import { doc, getDoc, updateDoc } from 'firebase/firestore'

const ConfiguracoesAdmin = () => {
  const bg = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.700')
  
  // Estados para as configurações
  const [activeTab, setActiveTab] = useState("salon")
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [primaryColor, setPrimaryColor] = useState("#5d3fd3")
  const [showColorPicker, setShowColorPicker] = useState(false)

  // Estados dos formulários
  const [salonInfo, setSalonInfo] = useState({
    name: "",
    phone: "",
    email: "",
    description: "",
    cep: "",
    rua: "",
    numero: "",
    bairro: "",
    cidade: "",
    estado: "",
    complemento: "",
    slug: ""
  })

  // Estados para verificar premium
  const [isPremium, setIsPremium] = useState(false)
  const [tipoPlano, setTipoPlano] = useState<string | null>(null)

  useEffect(() => {
    const fetchConta = async () => {
      if (!auth.currentUser?.uid) return
      const docRef = doc(firestore, 'contas', auth.currentUser.uid)
      const docSnap = await getDoc(docRef)
      if (docSnap.exists()) {
        const data = docSnap.data()
        setSalonInfo((prev) => ({
          ...prev,
          name: data.nomeEstabelecimento || "",
          phone: data.telefone || "",
          email: data.email || "",
          description: data.descricaoEstabelecimento || "",
          cep: data.cep || "",
          rua: data.rua || "",
          numero: data.numero || "",
          bairro: data.bairro || "",
          cidade: data.cidade || "",
          estado: data.estado || "",
          complemento: data.complemento || "",
          slug: data.slug || ""
        }))
        
        // Verificar se tem qualquer plano ativo (premium = true OU qualquer tipoPlano)
        const hasAnyPlan = data.premium === true || data.tipoPlano;
        setIsPremium(hasAnyPlan)
        setTipoPlano(data.tipoPlano || null)
        
        // Carregar cor principal se existir
        if (data.aparenciaAgendamento && data.aparenciaAgendamento.corPrincipal) {
          setPrimaryColor(data.aparenciaAgendamento.corPrincipal)
          console.log('Cor principal carregada:', data.aparenciaAgendamento.corPrincipal)
        }
        
        // Carregar outras configurações de aparência se existirem
        if (data.aparenciaAgendamento) {
          setAppearance((prev) => ({
            ...prev,
            displayName: data.aparenciaAgendamento.nomeExibicao || "",
            welcomeMessage: data.aparenciaAgendamento.mensagemBoasVindas || "",
            thankYouMessage: data.aparenciaAgendamento.mensagemAgradecimento || "",
          }))
          console.log('Configurações de aparência carregadas:', data.aparenciaAgendamento)
        }
        
        // Carregar logo se existir
        if (data.logo_url) {
          setLogoPreview(data.logo_url)
        }
        
        // Debug logs
        console.log('Configurações - Dados da conta:', {
          premium: data.premium,
          tipoPlano: data.tipoPlano,
          hasAnyPlan: hasAnyPlan,
          isPremium: hasAnyPlan,
          corPrincipal: data.aparenciaAgendamento?.corPrincipal
        });
      }
    }
    fetchConta()
  }, [auth.currentUser])

  // Função para buscar endereço pelo CEP
  const buscarEnderecoPorCep = async (cep: string) => {
    if (!cep || cep.length < 8) return
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep.replace(/\D/g, '')}/json/`)
      const data = await response.json()
      if (!data.erro) {
        setSalonInfo((prev) => ({
          ...prev,
          rua: data.logradouro || "",
          bairro: data.bairro || "",
          cidade: data.localidade || "",
          estado: data.uf || "",
        }))
      }
    } catch (error) {
      // Não faz nada se derro
    }
  }

  type WeekDayKey = "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday";
  type WorkingHour = { open: string; close: string; closed: boolean };
  const [workingHours, setWorkingHours] = useState<Record<WeekDayKey, WorkingHour>>({
    monday: { open: "08:00", close: "18:00", closed: false },
    tuesday: { open: "08:00", close: "18:00", closed: false },
    wednesday: { open: "08:00", close: "18:00", closed: false },
    thursday: { open: "08:00", close: "18:00", closed: false },
    friday: { open: "08:00", close: "18:00", closed: false },
    saturday: { open: "09:00", close: "17:00", closed: false },
    sunday: { open: "09:00", close: "17:00", closed: true },
  })

  const [policies, setPolicies] = useState({
    appointmentInterval: 15,
    maxAppointmentsPerDay: 8,
    cancellationHours: 24,
    rescheduleHours: 12,
    cancellationPolicy: "",
    reschedulePolicy: "",
  })

  const [appearance, setAppearance] = useState({
    displayName: "",
    bookingUrl: "",
    enableCustomPage: false,
    welcomeMessage: "",
    thankYouMessage: "",
  })

  const tabs = [
    { id: "salon", label: "Informações do Salão", icon: Building2 },
    { id: "schedule", label: "Horários e Políticas", icon: Clock },
    { id: "appearance", label: "Link próprio e Aparência", icon: Palette, premiumRequired: true },
  ]

  const weekDays = [
    { key: "monday", label: "Segunda-feira" },
    { key: "tuesday", label: "Terça-feira" },
    { key: "wednesday", label: "Quarta-feira" },
    { key: "thursday", label: "Quinta-feira" },
    { key: "friday", label: "Sexta-feira" },
    { key: "saturday", label: "Sábado" },
    { key: "sunday", label: "Domingo" },
  ]

  const predefinedColors = ["#5d3fd3", "#3b82f6", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#84cc16"]

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione apenas arquivos de imagem (JPG, PNG, SVG)')
      return
    }

    // Validar tamanho (2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert('O arquivo deve ter no máximo 2MB')
      return
    }

    setUploadingLogo(true)

    try {
      // Criar preview local
      const reader = new FileReader()
      reader.onload = (e) => {
        setLogoPreview((e.target?.result as string) || null)
      }
      reader.readAsDataURL(file)

      // Upload via backend (mais confiável)
      const formData = new FormData()
      formData.append('logo', file)
      formData.append('uid', auth.currentUser?.uid || '')

      const response = await fetch('https://trezu-backend.onrender.com/api/upload-logo', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Erro no upload')
      }

      const result = await response.json()
      
      if (result.success && result.logo_url) {
        // Salvar URL no Firestore
        const docRef = doc(firestore, 'contas', auth.currentUser?.uid || '')
        await updateDoc(docRef, {
          logo_url: result.logo_url
        })

        setLogoPreview(result.logo_url)
        alert('Logo enviada com sucesso!')
      } else {
        throw new Error(result.error || 'Erro desconhecido')
      }

    } catch (error) {
      console.error('Erro no upload da logo:', error)
      alert('Erro ao enviar logo. Tente novamente.')
      setLogoPreview(null)
    } finally {
      setUploadingLogo(false)
    }
  }

  const handleRemoveLogo = async () => {
    if (!auth.currentUser?.uid) return

    try {
      // Remover do Firestore
      const docRef = doc(firestore, 'contas', auth.currentUser.uid)
      await updateDoc(docRef, {
        logo_url: null
      })

      setLogoPreview(null)
      alert('Logo removida com sucesso!')
    } catch (error) {
      console.error('Erro ao remover logo:', error)
      alert('Erro ao remover logo. Tente novamente.')
    }
  }

  const handleWorkingHourChange = (day: WeekDayKey, field: string, value: string) => {
    // Garantir que o valor do input seja salvo exatamente como está
    setWorkingHours((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value,
      },
    }))
  }

  const handleSave = async () => {
    if (!auth.currentUser?.uid) return
    
    try {
      const docRef = doc(firestore, 'contas', auth.currentUser.uid)
      
      // Preparar dados para salvar
      const updateData: any = {
        nomeEstabelecimento: salonInfo.name,
        telefone: salonInfo.phone,
        email: salonInfo.email,
        descricaoEstabelecimento: salonInfo.description,
        cep: salonInfo.cep,
        rua: salonInfo.rua,
        numero: salonInfo.numero,
        bairro: salonInfo.bairro,
        cidade: salonInfo.cidade,
        estado: salonInfo.estado,
        complemento: salonInfo.complemento,
      }
      
      // Adicionar configurações de aparência (incluindo cor principal)
      updateData.aparenciaAgendamento = {
        corPrincipal: primaryColor,
        nomeExibicao: appearance.displayName,
        linkAgendamento: generateBookingUrl(),
        mensagemBoasVindas: appearance.welcomeMessage,
        mensagemAgradecimento: appearance.thankYouMessage,
      }
      
      // Adicionar horários
      const horariosParaSalvar = montarHorariosFunc();
      updateData.horariosFunc = horariosParaSalvar;
      
      // Adicionar políticas
      updateData.configuracoesAtendimento = {
        appointmentInterval: policies.appointmentInterval,
        maxAppointmentsPerDay: policies.maxAppointmentsPerDay,
      };
      updateData.politicas = {
        cancellationHours: policies.cancellationHours,
        rescheduleHours: policies.rescheduleHours,
        cancellationPolicy: policies.cancellationPolicy,
        reschedulePolicy: policies.reschedulePolicy,
      };
      
      // Salvar tudo no Firestore
      await updateDoc(docRef, updateData)
      
      alert("Todas as configurações foram salvas com sucesso!")
    } catch (error) {
      console.error('Erro ao salvar configurações:', error)
      alert('Erro ao salvar configurações. Tente novamente.')
    }
  }

  const [copied, setCopied] = useState(false)
  const copyTimeout = useRef<NodeJS.Timeout | null>(null)

  const generateBookingUrl = () => {
    const baseUrl = "https://trezu.com.br/agendar/"
    const slug = salonInfo.slug || ""
    return baseUrl + slug
  }

  const handleCopyUrl = () => {
    const url = generateBookingUrl()
    navigator.clipboard.writeText(url)
      .then(() => {
        setCopied(true)
        if (copyTimeout.current) clearTimeout(copyTimeout.current)
        copyTimeout.current = setTimeout(() => setCopied(false), 2000)
      })
      .catch(() => {
        setCopied(false)
      })
  }

  // Função para montar o array de horários para o Firestore
  const montarHorariosFunc = () => {
    return Object.entries(workingHours).map(([dia, valor]) => ({
      dia,
      aberto: !valor.closed,
      abertura: valor.open,
      fechamento: valor.close,
    }))
  }

  // Função para salvar horários e políticas
  const handleSaveHorarios = async () => {
    if (!auth.currentUser?.uid) return
    const horariosParaSalvar = montarHorariosFunc();
    const docRef = doc(firestore, 'contas', auth.currentUser.uid)
    await updateDoc(docRef, {
      horariosFunc: horariosParaSalvar,
      configuracoesAtendimento: {
        appointmentInterval: policies.appointmentInterval,
        maxAppointmentsPerDay: policies.maxAppointmentsPerDay,
      },
      politicas: {
        cancellationHours: policies.cancellationHours,
        rescheduleHours: policies.rescheduleHours,
        cancellationPolicy: policies.cancellationPolicy,
        reschedulePolicy: policies.reschedulePolicy,
      }
    })
    alert('Horários e políticas salvos com sucesso!')
  }

  // Função para salvar aparência e identidade
  const handleSaveAparencia = async () => {
    if (!auth.currentUser?.uid) return
    
    console.log('Salvando aparência com cor principal:', primaryColor)
    
    try {
      const docRef = doc(firestore, 'contas', auth.currentUser.uid)
      await updateDoc(docRef, {
        aparenciaAgendamento: {
          corPrincipal: primaryColor,
          nomeExibicao: appearance.displayName,
          linkAgendamento: generateBookingUrl(),
          mensagemBoasVindas: appearance.welcomeMessage,
          mensagemAgradecimento: appearance.thankYouMessage,
        }
      })
      console.log('Aparência salva com sucesso!')
      alert('Aparência e identidade salvas com sucesso!')
    } catch (error) {
      console.error('Erro ao salvar aparência:', error)
      alert('Erro ao salvar aparência. Tente novamente.')
    }
  }

  return (
    <Box className="configuracoes-container" bg={bg} minH="100vh">
      {/* Header */}
      <Box className="configuracoes-header" bg="white" shadow="sm" borderBottom="1px" borderColor={borderColor}>
        <Container maxW="container.xl" py={6}>
          <Flex justify="space-between" align="center">
            <HStack spacing={4}>
              <Icon as={Settings} boxSize={6} color="purple.500" />
              <Box>
                <Heading size="lg" color="gray.800">Configurações do Sistema</Heading>
                <Text color="gray.600" fontSize="sm">Personalize seu salão e defina suas políticas de atendimento</Text>
              </Box>
            </HStack>
            <Button
              leftIcon={<Icon as={Save} />}
              colorScheme="purple"
              onClick={handleSave}
            >
              Salvar Alterações
            </Button>
          </Flex>
        </Container>
      </Box>

      {/* Navigation Tabs */}
      <Box className="configuracoes-nav" bg="white" borderBottom="1px" borderColor={borderColor}>
        <Container maxW="container.xl">
          <HStack spacing={0} overflowX="auto" py={4}>
            {tabs.map((tab) => {
              const hasAnyPlan = isPremium || tipoPlano;
              const isDisabled = tab.premiumRequired && !hasAnyPlan;
              return (
                <Button
                  key={tab.id}
                  variant={activeTab === tab.id ? "solid" : "ghost"}
                  colorScheme="purple"
                  leftIcon={<Icon as={tab.icon} />}
                  isDisabled={isDisabled}
                  onClick={() => {
                    if (!isDisabled) {
                      setActiveTab(tab.id);
                    }
                  }}
                  size="md"
                  borderRadius="md"
                  _disabled={{
                    opacity: 0.6,
                    cursor: "not-allowed"
                  }}
                >
                  <HStack spacing={2}>
                    <Text>{tab.label}</Text>
                    {isDisabled && (
                      <Badge colorScheme="purple" size="sm">PREMIUM</Badge>
                    )}
                  </HStack>
                </Button>
              );
            })}
          </HStack>
        </Container>
      </Box>

      {/* Content */}
      <Box className="configuracoes-content" py={8}>
        <Container maxW="container.xl">
          {/* Informações do Salão */}
          {activeTab === "salon" && (
            <VStack spacing={8} align="stretch">
              <Card>
                <CardHeader>
                  <HStack spacing={3}>
                    <Icon as={Building2} color="purple.500" />
                    <Box>
                      <Heading size="md">Informações do Salão</Heading>
                      <Text color="gray.600" fontSize="sm">Configure as informações básicas do seu estabelecimento</Text>
                    </Box>
                  </HStack>
                </CardHeader>
                <CardBody>
                  <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={8}>
                    {/* Logo Upload */}
                    <Card>
                      <CardHeader>
                        <Heading size="sm">Logo do Estabelecimento</Heading>
                      </CardHeader>
                      <CardBody>
                        <VStack spacing={4}>
                          <Box
                            border="2px dashed"
                            borderColor={logoPreview ? "green.200" : "gray.200"}
                            borderRadius="lg"
                            p={6}
                            textAlign="center"
                            bg={logoPreview ? "green.50" : "gray.50"}
                            minH="120px"
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                          >
                            {logoPreview ? (
                              <Image
                                src={logoPreview}
                                alt="Logo preview"
                                maxH="200px"
                                objectFit="contain"
                                borderRadius="md"
                              />
                            ) : (
                              <VStack spacing={2}>
                                <Icon as={Camera} boxSize={8} color="gray.400" />
                                <Text color="gray.500" fontSize="sm">Nenhuma imagem selecionada</Text>
                              </VStack>
                            )}
                          </Box>
                          
                          <HStack spacing={3}>
                            <input
                              type="file"
                              id="logo-upload"
                              accept="image/*"
                              onChange={handleLogoUpload}
                              style={{ display: "none" }}
                              disabled={uploadingLogo}
                            />
                            <Button
                              as="label"
                              htmlFor="logo-upload"
                              leftIcon={uploadingLogo ? <Spinner size="sm" /> : <Icon as={Upload} />}
                              colorScheme="purple"
                              isLoading={uploadingLogo}
                              loadingText="Enviando..."
                              disabled={uploadingLogo}
                            >
                              Escolher Imagem
                            </Button>
                            
                            {logoPreview && !uploadingLogo && (
                              <Button
                                leftIcon={<Icon as={Trash2} />}
                                colorScheme="red"
                                variant="outline"
                                onClick={handleRemoveLogo}
                              >
                                Remover
                              </Button>
                            )}
                          </HStack>
                          
                          <Text fontSize="xs" color="gray.500">
                            Formatos aceitos: JPG, PNG, SVG. Tamanho máximo: 2MB
                          </Text>
                        </VStack>
                      </CardBody>
                    </Card>

                    {/* Informações Básicas */}
                    <Card>
                      <CardHeader>
                        <Heading size="sm">Informações Básicas</Heading>
                      </CardHeader>
                      <CardBody>
                        <VStack spacing={4}>
                          <FormControl>
                            <FormLabel>Nome do Salão *</FormLabel>
                            <Input
                              value={salonInfo.name}
                              onChange={(e) => setSalonInfo((prev) => ({ ...prev, name: e.target.value }))}
                              placeholder="Digite o nome do seu salão"
                            />
                          </FormControl>

                          <FormControl>
                            <FormLabel>Telefone *</FormLabel>
                            <InputGroup>
                              <InputLeftElement
                                pointerEvents="none"
                                children={<Icon as={Phone} color="gray.400" />}
                              />
                              <Input
                                value={salonInfo.phone}
                                onChange={(e) => setSalonInfo((prev) => ({ ...prev, phone: e.target.value }))}
                                placeholder="(11) 99999-9999"
                              />
                            </InputGroup>
                          </FormControl>

                          <FormControl>
                            <FormLabel>E-mail *</FormLabel>
                            <InputGroup>
                              <InputLeftElement
                                pointerEvents="none"
                                children={<Icon as={Mail} color="gray.400" />}
                              />
                              <Input
                                value={salonInfo.email}
                                onChange={(e) => setSalonInfo((prev) => ({ ...prev, email: e.target.value }))}
                                placeholder="contato@seusalao.com"
                              />
                            </InputGroup>
                          </FormControl>

                          <FormControl>
                            <FormLabel>CEP *</FormLabel>
                            <InputGroup>
                              <InputLeftElement
                                pointerEvents="none"
                                children={<Icon as={Globe} color="gray.400" />}
                              />
                              <Input
                                value={salonInfo.cep}
                                onChange={(e) => setSalonInfo((prev) => ({ ...prev, cep: e.target.value }))}
                                onBlur={() => buscarEnderecoPorCep(salonInfo.cep)}
                                placeholder="Digite o CEP"
                              />
                            </InputGroup>
                          </FormControl>

                          <FormControl>
                            <FormLabel>Rua</FormLabel>
                            <Input
                              value={salonInfo.rua}
                              onChange={(e) => setSalonInfo((prev) => ({ ...prev, rua: e.target.value }))}
                              placeholder="Rua"
                            />
                          </FormControl>

                          <FormControl>
                            <FormLabel>Número</FormLabel>
                            <Input
                              value={salonInfo.numero}
                              onChange={(e) => setSalonInfo((prev) => ({ ...prev, numero: e.target.value }))}
                              placeholder="Número"
                            />
                          </FormControl>

                          <FormControl>
                            <FormLabel>Bairro</FormLabel>
                            <Input
                              value={salonInfo.bairro}
                              onChange={(e) => setSalonInfo((prev) => ({ ...prev, bairro: e.target.value }))}
                              placeholder="Bairro"
                            />
                          </FormControl>

                          <FormControl>
                            <FormLabel>Cidade</FormLabel>
                            <Input
                              value={salonInfo.cidade}
                              onChange={(e) => setSalonInfo((prev) => ({ ...prev, cidade: e.target.value }))}
                              placeholder="Cidade"
                            />
                          </FormControl>

                          <FormControl>
                            <FormLabel>Estado</FormLabel>
                            <Input
                              value={salonInfo.estado}
                              onChange={(e) => setSalonInfo((prev) => ({ ...prev, estado: e.target.value }))}
                              placeholder="Estado"
                            />
                          </FormControl>

                          <FormControl>
                            <FormLabel>Complemento</FormLabel>
                            <Input
                              value={salonInfo.complemento}
                              onChange={(e) => setSalonInfo((prev) => ({ ...prev, complemento: e.target.value }))}
                              placeholder="Complemento"
                            />
                          </FormControl>
                        </VStack>
                      </CardBody>
                    </Card>
                  </SimpleGrid>

                  {/* Descrição */}
                  <Card>
                    <CardHeader>
                      <Heading size="sm">Descrição do Estabelecimento</Heading>
                    </CardHeader>
                    <CardBody>
                      <FormControl>
                        <FormLabel>Conte um pouco sobre seu salão</FormLabel>
                        <Textarea
                          value={salonInfo.description}
                          onChange={(e) => setSalonInfo((prev) => ({ ...prev, description: e.target.value }))}
                          placeholder="Descreva os serviços, ambiente, diferenciais do seu salão..."
                          rows={4}
                        />
                        <FormHelperText>
                          Esta descrição aparecerá na página de agendamento online
                        </FormHelperText>
                      </FormControl>
                    </CardBody>
                  </Card>
                </CardBody>
              </Card>
            </VStack>
          )}

          {/* Horários e Políticas */}
          {activeTab === "schedule" && (
            <VStack spacing={8} align="stretch">
              <Card>
                <CardHeader>
                  <HStack spacing={3}>
                    <Icon as={Clock} color="purple.500" />
                    <Box>
                      <Heading size="md">Horários e Políticas de Atendimento</Heading>
                      <Text color="gray.600" fontSize="sm">Configure os horários de funcionamento e políticas do seu salão</Text>
                    </Box>
                  </HStack>
                </CardHeader>
                <CardBody>
                  <VStack spacing={6}>
                    {/* Horários de Funcionamento */}
                    <Card>
                      <CardHeader>
                        <Heading size="sm">Horários de Funcionamento</Heading>
                      </CardHeader>
                      <CardBody>
                        <VStack spacing={4}>
                          {weekDays.map((day) => (
                            <Box
                              key={day.key}
                              p={4}
                              border="1px"
                              borderColor={borderColor}
                              borderRadius="md"
                              w="full"
                            >
                              <Flex justify="space-between" align="center" mb={3}>
                                <Text fontWeight="semibold">{day.label}</Text>
                                <HStack spacing={3}>
                                  <Text fontSize="sm">Aberto</Text>
                                  <Switch
                                    isChecked={!workingHours[day.key as WeekDayKey].closed}
                                    onChange={(e) => handleWorkingHourChange(day.key as WeekDayKey, "closed", (!e.target.checked).toString())}
                                    colorScheme="purple"
                                  />
                                </HStack>
                              </Flex>

                              {!workingHours[day.key as WeekDayKey].closed && (
                                <HStack spacing={4} align="center">
                                  <FormControl>
                                    <FormLabel fontSize="sm">Abertura</FormLabel>
                                    <Input
                                      type="time"
                                      value={workingHours[day.key as WeekDayKey].open}
                                      onChange={(e) => handleWorkingHourChange(day.key as WeekDayKey, "open", e.target.value)}
                                      size="sm"
                                    />
                                  </FormControl>
                                  
                                  <Text fontSize="sm" color="gray.500">até</Text>
                                  
                                  <FormControl>
                                    <FormLabel fontSize="sm">Fechamento</FormLabel>
                                    <Input
                                      type="time"
                                      value={workingHours[day.key as WeekDayKey].close}
                                      onChange={(e) => handleWorkingHourChange(day.key as WeekDayKey, "close", e.target.value)}
                                      size="sm"
                                    />
                                  </FormControl>
                                </HStack>
                              )}

                              {workingHours[day.key as WeekDayKey].closed && (
                                <Center p={3} bg="gray.50" borderRadius="md">
                                  <Text color="gray.500" fontWeight="medium">Fechado</Text>
                                </Center>
                              )}
                            </Box>
                          ))}
                        </VStack>
                        
                        <Button
                          leftIcon={<Icon as={Save} />}
                          colorScheme="purple"
                          onClick={handleSaveHorarios}
                          mt={6}
                        >
                          Salvar Horários e Políticas
                        </Button>
                      </CardBody>
                    </Card>

                    <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
                      {/* Configurações de Atendimento */}
                      <Card>
                        <CardHeader>
                          <Heading size="sm">Configurações de Atendimento</Heading>
                        </CardHeader>
                        <CardBody>
                          <VStack spacing={4}>
                            <FormControl>
                              <FormLabel>Intervalo entre Atendimentos</FormLabel>
                              <Select
                                value={policies.appointmentInterval}
                                onChange={(e) => setPolicies((prev) => ({ ...prev, appointmentInterval: Number.parseInt(e.target.value) }))}
                              >
                                <option value={15}>15 minutos</option>
                                <option value={30}>30 minutos</option>
                                <option value={45}>45 minutos</option>
                                <option value={60}>1 hora</option>
                              </Select>
                            </FormControl>

                            <FormControl>
                              <FormLabel>Limite de Atendimentos por Dia</FormLabel>
                              <Input
                                type="number"
                                value={policies.maxAppointmentsPerDay}
                                onChange={(e) => setPolicies((prev) => ({ ...prev, maxAppointmentsPerDay: Number.parseInt(e.target.value) }))}
                                min={1}
                                max={20}
                              />
                              <FormHelperText>Por profissional</FormHelperText>
                            </FormControl>
                          </VStack>
                        </CardBody>
                      </Card>

                      {/* Políticas de Cancelamento */}
                      <Card>
                        <CardHeader>
                          <Heading size="sm">Políticas de Cancelamento e Remarcação</Heading>
                        </CardHeader>
                        <CardBody>
                          <VStack spacing={4}>
                            <FormControl>
                              <FormLabel>Prazo para Cancelamento</FormLabel>
                              <Select
                                value={policies.cancellationHours}
                                onChange={(e) => setPolicies((prev) => ({ ...prev, cancellationHours: Number.parseInt(e.target.value) }))}
                              >
                                <option value={2}>2 horas antes</option>
                                <option value={4}>4 horas antes</option>
                                <option value={12}>12 horas antes</option>
                                <option value={24}>24 horas antes</option>
                                <option value={48}>48 horas antes</option>
                              </Select>
                            </FormControl>

                            <FormControl>
                              <FormLabel>Prazo para Remarcação</FormLabel>
                              <Select
                                value={policies.rescheduleHours}
                                onChange={(e) => setPolicies((prev) => ({ ...prev, rescheduleHours: Number.parseInt(e.target.value) }))}
                              >
                                <option value={2}>2 horas antes</option>
                                <option value={4}>4 horas antes</option>
                                <option value={12}>12 horas antes</option>
                                <option value={24}>24 horas antes</option>
                              </Select>
                            </FormControl>
                          </VStack>
                        </CardBody>
                      </Card>
                    </SimpleGrid>

                    {/* Textos das Políticas */}
                    <Card>
                      <CardHeader>
                        <Heading size="sm">Textos das Políticas</Heading>
                      </CardHeader>
                      <CardBody>
                        <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
                          <FormControl>
                            <FormLabel>Política de Cancelamento</FormLabel>
                            <Textarea
                              value={policies.cancellationPolicy}
                              onChange={(e) => setPolicies((prev) => ({ ...prev, cancellationPolicy: e.target.value }))}
                              placeholder="Descreva sua política de cancelamento..."
                              rows={3}
                            />
                          </FormControl>

                          <FormControl>
                            <FormLabel>Política de Remarcação</FormLabel>
                            <Textarea
                              value={policies.reschedulePolicy}
                              onChange={(e) => setPolicies((prev) => ({ ...prev, reschedulePolicy: e.target.value }))}
                              placeholder="Descreva sua política de remarcação..."
                              rows={3}
                            />
                          </FormControl>
                        </SimpleGrid>
                      </CardBody>
                    </Card>
                  </VStack>
                </CardBody>
              </Card>
            </VStack>
          )}

          {/* Aparência e Identidade */}
          {activeTab === "appearance" && (
            <VStack spacing={8} align="stretch">
              {!isPremium && !tipoPlano ? (
                <Card>
                  <CardBody>
                    <Center py={12}>
                      <VStack spacing={6} textAlign="center">
                        <Box fontSize="4xl">🎨</Box>
                        <Heading size="lg">Funcionalidade Premium</Heading>
                        <Text color="gray.600" maxW="md">
                          A personalização de aparência e identidade está disponível apenas para usuários Premium.
                          Ative o Premium para personalizar cores, mensagens e identidade visual do seu agendamento.
                        </Text>
                        <Button
                          colorScheme="purple"
                          size="lg"
                          onClick={() => {
                            window.location.href = `/dashboard/${auth.currentUser?.uid}/plano`;
                          }}
                        >
                          Ativar Premium
                        </Button>
                      </VStack>
                    </Center>
                  </CardBody>
                </Card>
              ) : (
                <Card>
                  <CardHeader>
                    <HStack spacing={3}>
                      <Icon as={Palette} color="purple.500" />
                      <Box>
                        <Heading size="md">Link personalizado e Aparência</Heading>
                        <Text color="gray.600" fontSize="sm">Pegue seu link personalizado e personalize a aparência da sua página de agendamento online</Text>
                      </Box>
                    </HStack>
                  </CardHeader>
                  <CardBody>
                    <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={8}>
                      {/* Cor Principal */}
                      <Card>
                        <CardHeader>
                          <Heading size="sm">Cor Principal</Heading>
                        </CardHeader>
                        <CardBody>
                          <VStack spacing={4}>
                            <HStack spacing={4}>
                              <Box
                                w="40px"
                                h="40px"
                                borderRadius="md"
                                bg={primaryColor}
                                border="2px"
                                borderColor={borderColor}
                                cursor="pointer"
                                onClick={() => setShowColorPicker(!showColorPicker)}
                              />
                              <Text>{primaryColor}</Text>
                            </HStack>

                            <HStack spacing={2} flexWrap="wrap">
                              {predefinedColors.map((color) => (
                                <Box
                                  key={color}
                                  w="32px"
                                  h="32px"
                                  borderRadius="sm"
                                  bg={color}
                                  border="2px"
                                  borderColor={primaryColor === color ? "gray.800" : "transparent"}
                                  cursor="pointer"
                                  onClick={() => setPrimaryColor(color)}
                                  _hover={{ transform: "scale(1.1)" }}
                                  transition="all 0.2s"
                                />
                              ))}
                            </HStack>

                            <HStack spacing={3}>
                              <Input
                                type="color"
                                value={primaryColor}
                                onChange={(e) => setPrimaryColor(e.target.value)}
                                w="40px"
                                h="40px"
                                p={0}
                                border="none"
                                borderRadius="md"
                                cursor="pointer"
                              />
                              <Text fontSize="sm" color="gray.600">Cor personalizada</Text>
                            </HStack>
                          </VStack>
                        </CardBody>
                      </Card>

                      {/* Link de Agendamento */}
                      <Card>
                        <CardHeader>
                          <Heading size="sm">Link de Agendamento Online</Heading>
                        </CardHeader>
                        <CardBody>
                          <VStack spacing={4}>
                            <HStack
                              p={3}
                              bg="gray.50"
                              borderRadius="md"
                              w="full"
                              spacing={3}
                            >
                              <Icon as={Globe} color="purple.500" />
                              <Text
                                fontFamily="mono"
                                color="purple.600"
                                fontWeight="medium"
                                flex={1}
                                wordBreak="break-all"
                              >
                                {generateBookingUrl()}
                              </Text>
                              <Button
                                size="sm"
                                colorScheme="purple"
                                onClick={handleCopyUrl}
                              >
                                {copied ? "Copiado!" : "Copiar"}
                              </Button>
                            </HStack>
                          </VStack>
                        </CardBody>
                      </Card>

                      {/* Mensagens Personalizadas */}
                      <Card>
                        <CardHeader>
                          <Heading size="sm">Mensagem de Boas-vindas</Heading>
                        </CardHeader>
                        <CardBody>
                          <FormControl>
                            <FormLabel>Texto de Boas-vindas</FormLabel>
                            <Textarea
                              value={appearance.welcomeMessage}
                              onChange={(e) => setAppearance((prev) => ({ ...prev, welcomeMessage: e.target.value }))}
                              placeholder="Bem-vindo ao nosso salão! Escolha o melhor horário para você."
                              rows={3}
                            />
                          </FormControl>
                        </CardBody>
                      </Card>

                      <Card>
                        <CardHeader>
                          <Heading size="sm">Mensagem de Agradecimento</Heading>
                        </CardHeader>
                        <CardBody>
                          <FormControl>
                            <FormLabel>Texto após Agendamento</FormLabel>
                            <Textarea
                              value={appearance.thankYouMessage}
                              onChange={(e) => setAppearance((prev) => ({ ...prev, thankYouMessage: e.target.value }))}
                              placeholder="Obrigado por agendar conosco! Confirmaremos seu horário em breve."
                              rows={3}
                            />
                          </FormControl>
                        </CardBody>
                      </Card>
                    </SimpleGrid>

                    {/* Botão para salvar aparência */}
                    <Card>
                      <CardBody>
                        <Flex justify="flex-end">
                          <Button
                            leftIcon={<Icon as={Save} />}
                            colorScheme="purple"
                            onClick={handleSaveAparencia}
                          >
                            Salvar Aparência
                          </Button>
                        </Flex>
                      </CardBody>
                    </Card>
                  </CardBody>
                </Card>
              )}
            </VStack>
          )}
        </Container>
      </Box>

      {/* Floating Save Button */}
      <Box
        position="fixed"
        bottom={6}
        right={6}
        zIndex={1000}
      >
        <Button
          leftIcon={<Icon as={Save} />}
          colorScheme="purple"
          size="lg"
          onClick={handleSave}
          shadow="lg"
        >
          Salvar Todas as Configurações
        </Button>
      </Box>
    </Box>
  )
}

export default ConfiguracoesAdmin
