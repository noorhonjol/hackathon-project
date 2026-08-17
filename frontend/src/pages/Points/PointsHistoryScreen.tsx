import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Container,
  Heading,
  Spinner,
  Text,
  VStack,
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../services/supabase";
import { apiFetch } from "../../services/api";
import type { HistoryEntry } from "../../types/api";

export default function PointsHistoryScreen() {
  const navigate = useNavigate();
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const token = (await supabase.auth.getSession()).data.session?.access_token;
      if (!token) return;
      try {
        const data = await apiFetch<HistoryEntry[]>("/points/history", token);
        setEntries(data);
      } catch {}
      setLoading(false);
    })();
  }, []);

  return (
    <Container maxW="container.md" py={10}>
      <VStack spacing={4} align="stretch">
        <Heading size="lg">📊 Points History</Heading>

        {loading ? (
          <Spinner />
        ) : entries.length === 0 ? (
          <Text color="gray.500">No points earned yet.</Text>
        ) : (
          entries.map((e) => (
            <Box
              key={e.id}
              p={4}
              borderWidth="1px"
              borderRadius="lg"
              display="flex"
              justifyContent="space-between"
              alignItems="center"
            >
              <Box>
                <Text fontWeight="bold">{e.label}</Text>
                <Text fontSize="sm" color="gray.500">
                  {new Date(e.created_at).toLocaleString()}
                </Text>
              </Box>
              <Text
                fontSize="xl"
                fontWeight="bold"
                color={e.amount > 0 ? "green.500" : e.amount === 0 ? "orange.400" : "red.500"}
              >
                {e.amount > 0 ? `+${e.amount}` : e.amount === 0 ? "⏳" : e.amount}
              </Text>
            </Box>
          ))
        )}

        <Button mt={4} onClick={() => navigate(-1)}>
          Back
        </Button>
      </VStack>
    </Container>
  );
}