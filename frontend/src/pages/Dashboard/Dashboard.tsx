import { useEffect, useState } from "react";
import { Box, Button, Container, Heading, Spinner, Text, VStack } from "@chakra-ui/react";
import { useAuth } from "../../hooks/useAuth";
import { supabase } from "../../services/supabase";
import { apiFetch } from "../../services/api";
import type { MeResponse } from "../../types/api";

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const [meData, setMeData] = useState<MeResponse | null>(null);
  const [meError, setMeError] = useState("");
  const [meLoading, setMeLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        const token = session?.access_token;
        if (token) {
          const data = await apiFetch<MeResponse>("/me", token);
          setMeData(data);
        }
      } catch (err) {
        setMeError((err as Error).message);
      }
      setMeLoading(false);
    })();
  }, []);

  return (
    <Container maxW="container.md" centerContent py={10}>
      <VStack spacing={6} align="stretch" w="100%">
        <VStack spacing={2} textAlign="center">
          <Heading size="2xl">Welcome, you&apos;re logged in!</Heading>
          <Text color="gray.500">
            Supabase Auth · FastAPI JWT verification · Full-stack auth handoff
          </Text>
        </VStack>

        <Box p={6} shadow="md" borderWidth="1px" borderRadius="lg">
          <Heading size="md" mb={3}>
            User Info
          </Heading>
          {user && (
            <Text>
              <strong>Email:</strong> {user.email}
            </Text>
          )}
        </Box>

        <Box p={6} shadow="md" borderWidth="1px" borderRadius="lg">
          <Heading size="md" mb={3}>
            Backend GET /me
          </Heading>
          {meLoading ? (
            <Spinner />
          ) : meError ? (
            <Text color="red.500">Error: {meError}</Text>
          ) : meData ? (
            <>
              <Text>
                <strong>User ID (from backend):</strong> {meData.user_id}
              </Text>
              <Text>
                <strong>Email (from backend):</strong> {meData.email}
              </Text>
            </>
          ) : null}
        </Box>

        <Button colorScheme="red" onClick={signOut}>
          Sign Out
        </Button>
      </VStack>
    </Container>
  );
}