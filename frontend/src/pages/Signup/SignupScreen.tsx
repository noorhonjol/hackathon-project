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

interface SignupScreenProps {
  onToggle: () => void;
}

export default function SignupScreen({ onToggle }: SignupScreenProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { error: authError } = await supabase.auth.signUp({ email, password });
    if (authError) setError(authError.message);
    else setSuccess(true);
    setLoading(false);
  };

  if (success) {
    return (
      <Container maxW="sm" centerContent py={20}>
        <Box w="100%" p={8} borderWidth="1px" borderRadius="xl" shadow="md" textAlign="center" bg="white">
          <VStack spacing={4}>
            <Heading size="xl">✅</Heading>
            <Heading size="lg" color="palestine.green">Signed Up!</Heading>
            <Text>Check your email for a confirmation link, or try logging in.</Text>
            <Button onClick={onToggle}>Go to Log In</Button>
          </VStack>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxW="sm" centerContent py={20}>
      <VStack spacing={8} w="100%">
        <Box w="100%" h="6px" display="flex" borderRadius="full" overflow="hidden">
          <Box flex={1} bg="#E4312B" /><Box flex={1} bg="#1C1C1C" /><Box flex={1} bg="#FFFFFF" borderX="1px solid" borderColor="gray.200" /><Box flex={1} bg="#149954" />
        </Box>
        <Box textAlign="center">
          <Heading size="3xl" color="palestine.red">🌱 Qoffa</Heading>
          <Text color="gray.500" mt={1}>Towards a cleaner Palestine</Text>
        </Box>
        <Box w="100%" p={8} borderWidth="1px" borderRadius="xl" shadow="md" bg="white">
          <form onSubmit={handleSignup}>
            <VStack spacing={4}>
              <Heading size="md" color="palestine.green">Sign Up</Heading>
              <FormControl isInvalid={!!error}>
                <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </FormControl>
              <FormControl isInvalid={!!error}>
                <Input type="password" placeholder="Password (6+ characters)" value={password} onChange={(e) => setPassword(e.target.value)} required />
                {error && <FormErrorMessage>{error}</FormErrorMessage>}
              </FormControl>
              <Button type="submit" w="100%" isLoading={loading}>Sign Up</Button>
              <Text fontSize="sm" color="gray.500">
                Already have an account?{" "}
                <Link color="palestine.green" fontWeight="bold" onClick={onToggle}>Log In</Link>
              </Text>
            </VStack>
          </form>
        </Box>
      </VStack>
    </Container>
  );
}