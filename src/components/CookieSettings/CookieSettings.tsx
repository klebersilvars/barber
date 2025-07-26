import React, { useState } from 'react';
import {
  Box,
  Text,
  Button,
  VStack,
  HStack,
  useColorModeValue,
  Icon,
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
  Badge,
  useToast,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
} from '@chakra-ui/react';
import { FiShield, FiSettings, FiInfo, FiRefreshCw } from 'react-icons/fi';
import { useCookies } from '../../hooks/useCookies';
import type { CookiePreferences } from '../../hooks/useCookies';

interface CookieSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

const CookieSettings: React.FC<CookieSettingsProps> = ({ isOpen, onClose }) => {
  const { preferences, updatePreferences, resetCookies } = useCookies();
  const [localPreferences, setLocalPreferences] = useState<CookiePreferences>(preferences);
  const toast = useToast();
  
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const textColor = useColorModeValue('gray.800', 'white');
  const secondaryTextColor = useColorModeValue('gray.600', 'gray.300');

  const handlePreferenceChange = (key: keyof CookiePreferences) => {
    if (key === 'necessary') return; // Necessary cookies cannot be disabled
    setLocalPreferences(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSave = () => {
    updatePreferences(localPreferences);
    toast({
      title: 'Preferências salvas',
      description: 'Suas preferências de cookies foram atualizadas com sucesso.',
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
    onClose();
  };

  const handleReset = () => {
    resetCookies();
    setLocalPreferences({
      necessary: true,
      analytics: false,
      marketing: false,
      functional: false,
    });
    toast({
      title: 'Cookies resetados',
      description: 'Todas as preferências de cookies foram resetadas.',
      status: 'info',
      duration: 3000,
      isClosable: true,
    });
  };

  const handleCancel = () => {
    setLocalPreferences(preferences); // Reset to original preferences
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size={{ base: "full", md: "lg" }}>
      <ModalOverlay />
      <ModalContent mx={{ base: 2, md: 0 }} maxH={{ base: "90vh", md: "auto" }}>
        <ModalHeader>
          <HStack spacing={2}>
            <Icon as={FiShield} color="blue.500" boxSize={{ base: 4, md: 5 }} />
            <Text fontSize={{ base: "lg", md: "xl" }}>Configurações de Cookies</Text>
          </HStack>
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6} px={{ base: 4, md: 6 }}>
          <VStack spacing={{ base: 4, md: 6 }} align="stretch">
            <Alert status="info" borderRadius="md">
              <AlertIcon />
              <Box>
                <AlertTitle fontSize={{ base: "sm", md: "md" }}>Gerenciamento de Cookies</AlertTitle>
                <AlertDescription fontSize={{ base: "xs", md: "sm" }}>
                  Controle quais tipos de cookies você permite em nosso site. 
                  Os cookies necessários são sempre ativos para garantir o funcionamento básico.
                </AlertDescription>
              </Box>
            </Alert>

            <Stack spacing={{ base: 3, md: 4 }}>
              {/* Cookies Necessários */}
              <Box p={{ base: 3, md: 4 }} border="1px" borderColor={borderColor} borderRadius="md" bg={useColorModeValue('green.50', 'green.900')}>
                <HStack justify="space-between" mb={2}>
                  <VStack align="start" spacing={1} flex={1}>
                    <HStack>
                      <Text fontWeight="bold" fontSize={{ base: "sm", md: "md" }}>Cookies Necessários</Text>
                      <Badge colorScheme="green" size="sm">Sempre Ativo</Badge>
                    </HStack>
                    <Text fontSize={{ base: "xs", md: "sm" }} color={secondaryTextColor}>
                      Essenciais para o funcionamento básico do site (sessão, segurança, etc.)
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
                      Nos ajudam a entender como você usa o site e melhorar a experiência
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
                      Melhoram a funcionalidade e personalização do site
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
                      Usados para publicidade e marketing personalizado
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
              <HStack justify="space-between">
                <Text fontSize={{ base: "xs", md: "sm" }} color={secondaryTextColor}>
                  <Icon as={FiInfo} mr={2} boxSize={{ base: 3, md: 4 }} />
                  Para mais informações, consulte nossa{' '}
                  <Button variant="link" color="blue.500" size={{ base: "xs", md: "sm" }}>
                    Política de Privacidade
                  </Button>
                </Text>
              </HStack>

              <HStack spacing={{ base: 2, md: 3 }} justify="space-between" direction={{ base: "column", sm: "row" }}>
                <Button
                  leftIcon={<FiRefreshCw />}
                  variant="outline"
                  size={{ base: "sm", md: "md" }}
                  onClick={handleReset}
                  w={{ base: "full", sm: "auto" }}
                >
                  Resetar Preferências
                </Button>
                <HStack spacing={{ base: 2, md: 3 }} w={{ base: "full", sm: "auto" }}>
                  <Button 
                    variant="outline" 
                    onClick={handleCancel}
                    size={{ base: "sm", md: "md" }}
                    flex={{ base: 1, sm: "none" }}
                  >
                    Cancelar
                  </Button>
                  <Button 
                    colorScheme="blue" 
                    onClick={handleSave}
                    size={{ base: "sm", md: "md" }}
                    flex={{ base: 1, sm: "none" }}
                  >
                    Salvar Alterações
                  </Button>
                </HStack>
              </HStack>
            </VStack>
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default CookieSettings; 