import React, { useState, useEffect } from 'react';
import {
  Box,
  Text,
  Button,
  VStack,
  HStack,
  Link,
  useColorModeValue,
  Icon,
  Flex,
  Container,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Divider,
  Checkbox,
  Stack,
  Badge
} from '@chakra-ui/react';
import { FiShield, FiSettings, FiInfo } from 'react-icons/fi';
import { useCookies } from '../../hooks/useCookies';
import type { CookiePreferences } from '../../hooks/useCookies';

const CookieBanner: React.FC = () => {
  const { cookiesAccepted, preferences, acceptAllCookies, acceptNecessaryCookies, updatePreferences } = useCookies();
  const [showBanner, setShowBanner] = useState(false);
  const [localPreferences, setLocalPreferences] = useState<CookiePreferences>(preferences);
  
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();
  
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const textColor = useColorModeValue('gray.800', 'white');
  const secondaryTextColor = useColorModeValue('gray.600', 'gray.300');

  useEffect(() => {
    if (!cookiesAccepted) {
      setShowBanner(true);
    }
  }, [cookiesAccepted]);

  useEffect(() => {
    setLocalPreferences(preferences);
  }, [preferences]);

  const handleAcceptAll = () => {
    acceptAllCookies();
    setShowBanner(false);
    toast({
      title: 'Cookies aceitos',
      description: 'Suas preferências foram salvas com sucesso.',
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
  };

  const handleAcceptNecessary = () => {
    acceptNecessaryCookies();
    setShowBanner(false);
    toast({
      title: 'Cookies necessários aceitos',
      description: 'Apenas cookies essenciais foram aceitos.',
      status: 'info',
      duration: 3000,
      isClosable: true,
    });
  };

  const handleSavePreferences = () => {
    updatePreferences(localPreferences);
    setShowBanner(false);
    onClose();
    toast({
      title: 'Preferências salvas',
      description: 'Suas preferências de cookies foram salvas.',
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
  };

  const handlePreferenceChange = (key: keyof CookiePreferences) => {
    if (key === 'necessary') return; // Necessary cookies cannot be disabled
    setLocalPreferences(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  if (!showBanner) return null;

  return (
    <>
      {/* Banner Principal */}
      <Box
        position="fixed"
        bottom="0"
        left="0"
        right="0"
        zIndex={9999}
        bg={bgColor}
        borderTop="1px"
        borderColor={borderColor}
        boxShadow="lg"
        py={{ base: 3, md: 4 }}
        px={{ base: 2, md: 0 }}
      >
        <Container maxW="container.xl" px={{ base: 2, md: 4 }}>
          <Flex
            direction={{ base: 'column', md: 'row' }}
            align={{ base: 'stretch', md: 'center' }}
            justify="space-between"
            gap={{ base: 4, md: 4 }}
          >
            <VStack align="start" spacing={{ base: 2, md: 3 }} flex={1}>
              <HStack spacing={2}>
                <Icon as={FiShield} color="blue.500" boxSize={{ base: 4, md: 5 }} />
                <Text fontWeight="bold" color={textColor} fontSize={{ base: "md", md: "lg" }}>
                  Política de Cookies
                </Text>
              </HStack>
              <Text 
                color={secondaryTextColor} 
                fontSize={{ base: "xs", md: "sm" }} 
                lineHeight="tall"
                textAlign={{ base: "left", md: "left" }}
              >
                Utilizamos cookies para melhorar sua experiência, analisar o tráfego e personalizar conteúdo. 
                Ao continuar navegando, você concorda com nossa{' '}
                <Link color="blue.500" href="/politica-privacidade" isExternal>
                  Política de Privacidade
                </Link>
                .
              </Text>
            </VStack>
            
            <HStack 
              spacing={{ base: 2, md: 3 }} 
              flexShrink={0}
              w={{ base: "full", md: "auto" }}
              justify={{ base: "space-between", md: "flex-end" }}
            >
              <Button
                size={{ base: "xs", md: "sm" }}
                variant="outline"
                leftIcon={<FiSettings />}
                onClick={onOpen}
                flex={{ base: 1, md: "none" }}
                fontSize={{ base: "xs", md: "sm" }}
              >
                <Text display={{ base: "none", sm: "block" }}>Personalizar</Text>
                <Text display={{ base: "block", sm: "none" }}>Config</Text>
              </Button>
              <Button
                size={{ base: "xs", md: "sm" }}
                variant="outline"
                onClick={handleAcceptNecessary}
                flex={{ base: 1, md: "none" }}
                fontSize={{ base: "xs", md: "sm" }}
              >
                <Text display={{ base: "none", sm: "block" }}>Apenas Necessários</Text>
                <Text display={{ base: "block", sm: "none" }}>Necessários</Text>
              </Button>
              <Button
                size={{ base: "xs", md: "sm" }}
                colorScheme="blue"
                onClick={handleAcceptAll}
                flex={{ base: 1, md: "none" }}
                fontSize={{ base: "xs", md: "sm" }}
              >
                <Text display={{ base: "none", sm: "block" }}>Aceitar Todos</Text>
                <Text display={{ base: "block", sm: "none" }}>Aceitar</Text>
              </Button>
            </HStack>
          </Flex>
        </Container>
      </Box>

      {/* Modal de Preferências */}
      <Modal isOpen={isOpen} onClose={onClose} size={{ base: "full", md: "lg" }}>
        <ModalOverlay />
        <ModalContent mx={{ base: 2, md: 0 }} maxH={{ base: "90vh", md: "auto" }}>
          <ModalHeader>
            <HStack spacing={2}>
              <Icon as={FiSettings} color="blue.500" boxSize={{ base: 4, md: 5 }} />
              <Text fontSize={{ base: "lg", md: "xl" }}>Preferências de Cookies</Text>
            </HStack>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6} px={{ base: 4, md: 6 }}>
            <VStack spacing={{ base: 4, md: 6 }} align="stretch">
              <Text color={secondaryTextColor} fontSize={{ base: "xs", md: "sm" }}>
                Gerencie suas preferências de cookies. Os cookies necessários são essenciais para o funcionamento do site.
              </Text>
              
              <Stack spacing={{ base: 3, md: 4 }}>
                {/* Cookies Necessários */}
                <Box p={{ base: 3, md: 4 }} border="1px" borderColor={borderColor} borderRadius="md">
                  <HStack justify="space-between" mb={2}>
                    <VStack align="start" spacing={1} flex={1}>
                      <HStack>
                        <Text fontWeight="bold" fontSize={{ base: "sm", md: "md" }}>Cookies Necessários</Text>
                        <Badge colorScheme="green" size="sm">Sempre Ativo</Badge>
                      </HStack>
                      <Text fontSize={{ base: "xs", md: "sm" }} color={secondaryTextColor}>
                        Essenciais para o funcionamento básico do site
                      </Text>
                    </VStack>
                    <Checkbox isChecked={true} isDisabled />
                  </HStack>
                </Box>

                {/* Cookies Analíticos */}
                <Box p={{ base: 3, md: 4 }} border="1px" borderColor={borderColor} borderRadius="md">
                  <HStack justify="space-between" mb={2}>
                    <VStack align="start" spacing={1} flex={1}>
                      <HStack>
                        <Text fontWeight="bold" fontSize={{ base: "sm", md: "md" }}>Cookies Analíticos</Text>
                        <Badge colorScheme="blue" size="sm">Opcional</Badge>
                      </HStack>
                      <Text fontSize={{ base: "xs", md: "sm" }} color={secondaryTextColor}>
                        Nos ajudam a entender como você usa o site
                      </Text>
                    </VStack>
                    <Checkbox 
                      isChecked={localPreferences.analytics}
                      onChange={() => handlePreferenceChange('analytics')}
                    />
                  </HStack>
                </Box>

                {/* Cookies Funcionais */}
                <Box p={{ base: 3, md: 4 }} border="1px" borderColor={borderColor} borderRadius="md">
                  <HStack justify="space-between" mb={2}>
                    <VStack align="start" spacing={1} flex={1}>
                      <HStack>
                        <Text fontWeight="bold" fontSize={{ base: "sm", md: "md" }}>Cookies Funcionais</Text>
                        <Badge colorScheme="purple" size="sm">Opcional</Badge>
                      </HStack>
                      <Text fontSize={{ base: "xs", md: "sm" }} color={secondaryTextColor}>
                        Melhoram a funcionalidade e personalização
                      </Text>
                    </VStack>
                    <Checkbox 
                      isChecked={localPreferences.functional}
                      onChange={() => handlePreferenceChange('functional')}
                    />
                  </HStack>
                </Box>

                {/* Cookies de Marketing */}
                <Box p={{ base: 3, md: 4 }} border="1px" borderColor={borderColor} borderRadius="md">
                  <HStack justify="space-between" mb={2}>
                    <VStack align="start" spacing={1} flex={1}>
                      <HStack>
                        <Text fontWeight="bold" fontSize={{ base: "sm", md: "md" }}>Cookies de Marketing</Text>
                        <Badge colorScheme="orange" size="sm">Opcional</Badge>
                      </HStack>
                      <Text fontSize={{ base: "xs", md: "sm" }} color={secondaryTextColor}>
                        Usados para publicidade e marketing
                      </Text>
                    </VStack>
                    <Checkbox 
                      isChecked={localPreferences.marketing}
                      onChange={() => handlePreferenceChange('marketing')}
                    />
                  </HStack>
                </Box>
              </Stack>

              <Divider />

              <VStack spacing={{ base: 3, md: 4 }} align="stretch">
                <Link color="blue.500" fontSize={{ base: "xs", md: "sm" }} href="/politica-cookies">
                  <HStack spacing={1}>
                    <Icon as={FiInfo} boxSize={{ base: 3, md: 4 }} />
                    <Text>Ler Política Completa</Text>
                  </HStack>
                </Link>
                <HStack 
                  spacing={{ base: 2, md: 3 }} 
                  direction={{ base: "column", sm: "row" }}
                  justify="space-between"
                >
                  <Button 
                    variant="outline" 
                    onClick={onClose}
                    size={{ base: "sm", md: "md" }}
                    w={{ base: "full", sm: "auto" }}
                  >
                    Cancelar
                  </Button>
                  <Button 
                    colorScheme="blue" 
                    onClick={handleSavePreferences}
                    size={{ base: "sm", md: "md" }}
                    w={{ base: "full", sm: "auto" }}
                  >
                    Salvar Preferências
                  </Button>
                </HStack>
              </VStack>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
};

export default CookieBanner; 