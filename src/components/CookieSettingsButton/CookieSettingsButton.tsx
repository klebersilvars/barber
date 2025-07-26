import React from 'react';
import {
  IconButton,
  useColorModeValue,
  useDisclosure,
  Tooltip,
} from '@chakra-ui/react';
import { FiShield } from 'react-icons/fi';
import CookieSettings from '../CookieSettings/CookieSettings';

const CookieSettingsButton: React.FC = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  return (
    <>
      <Tooltip label="Configurações de Cookies" placement="left">
        <IconButton
          aria-label="Configurações de Cookies"
          icon={<FiShield />}
          size={{ base: "md", md: "lg" }}
          colorScheme="blue"
          variant="solid"
          position="fixed"
          bottom={{ base: "16", md: "20" }}
          right={{ base: "3", md: "4" }}
          zIndex={1000}
          borderRadius="full"
          boxShadow="lg"
          bg={bgColor}
          border="1px"
          borderColor={borderColor}
          _hover={{
            transform: 'scale(1.1)',
            boxShadow: 'xl',
          }}
          onClick={onOpen}
          display={{ base: "flex", md: "flex" }}
        />
      </Tooltip>
      
      <CookieSettings isOpen={isOpen} onClose={onClose} />
    </>
  );
};

export default CookieSettingsButton; 