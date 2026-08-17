import {
  Box,
  Button,
  Container,
  Heading,
  Text,
  VStack,
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

type Role = "citizen" | "store_owner";

interface RoleSelectScreenProps {
  onSelect: (role: Role) => void;
}

export default function RoleSelectScreen({ onSelect }: RoleSelectScreenProps) {
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate("/login", { replace: true });
  };

  const handleSelect = (role: Role) => {
    onSelect(role);
    navigate("/onboarding/name", { state: { role } });
  };

  return (
    <Container maxW="sm" centerContent py={20}>
      <VStack spacing={8} w="100%">
        <VStack spacing={2} textAlign="center">
          <Heading size="xl">Welcome to Qoffa!</Heading>
          <Text color="gray.500">What brings you here?</Text>
        </VStack>

        <Box
          as="button"
          w="100%"
          p={6}
          borderWidth="2px"
          borderRadius="lg"
          textAlign="left"
          _hover={{ borderColor: "blue.400", bg: "blue.50" }}
          onClick={() => handleSelect("store_owner")}
        >
          <Heading size="md" mb={1}>
            🏪 I&apos;m a Shop Owner
          </Heading>
          <Text color="gray.500" fontSize="sm">
            Reduce single-use bags at my store and reward customers
          </Text>
        </Box>

        <Box
          as="button"
          w="100%"
          p={6}
          borderWidth="2px"
          borderRadius="lg"
          textAlign="left"
          _hover={{ borderColor: "green.400", bg: "green.50" }}
          onClick={() => handleSelect("citizen")}
        >
          <Heading size="md" mb={1}>
            🌱 I&apos;m a Citizen
          </Heading>
          <Text color="gray.500" fontSize="sm">
            Report waste and earn points for eco-friendly actions
          </Text>
        </Box>

        <Button variant="ghost" colorScheme="red" size="sm" onClick={handleSignOut}>
          Sign Out
        </Button>
      </VStack>
    </Container>
  );
}