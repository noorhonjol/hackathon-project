import { useState } from "react";
import {
  Box,
  Button,
  Container,
  FormControl,
  FormErrorMessage,
  Heading,
  Input,
  Link,
  Text,
  VStack,
} from "@chakra-ui/react";
import { supabase } from "../../services/supabase";

interface LoginScreenProps {
  onToggle: () => void;
}

export default function LoginScreen({ onToggle }: LoginScreenProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError) setError(authError.message);
    setLoading(false);
  };

  return (
    <Container maxW="sm" centerContent py={20}>
      <VStack spacing={8} w="100%">
        {/* Flag bar */}
        <Box w="100%" h="6px" display="flex" borderRadius="full" overflow="hidden">
          <Box flex={1} bg="#E4312B" /><Box flex={1} bg="#1C1C1C" /><Box flex={1} bg="#FFFFFF" borderX="1px solid" borderColor="gray.200" /><Box flex={1} bg="#149954" />
        </Box>

        {/* Brand */}
        <Box textAlign="center">
          <Heading size="3xl" color="palestine.red">🌱 Qoffa</Heading>
          <Text color="gray.500" mt={1}>Towards a cleaner Palestine</Text>
        </Box>

        {/* Form */}
        <Box w="100%" p={8} borderWidth="1px" borderRadius="xl" shadow="md" bg="white">
          <form onSubmit={handleLogin}>
            <VStack spacing={4}>
              <Heading size="md" color="palestine.green">Log In</Heading>
              <FormControl isInvalid={!!error}>
                <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </FormControl>
              <FormControl isInvalid={!!error}>
                <Input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                {error && <FormErrorMessage>{error}</FormErrorMessage>}
              </FormControl>
              <Button type="submit" w="100%" isLoading={loading}>
                Log In
              </Button>
              <Text fontSize="sm" color="gray.500">
                Don't have an account?{" "}
                <Link color="palestine.green" fontWeight="bold" onClick={onToggle}>Sign Up</Link>
              </Text>
            </VStack>
          </form>
        </Box>
      </VStack>
    </Container>
  );
}