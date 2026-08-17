import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Container,
  Flex,
  Heading,
  Spinner,
  Table,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
  VStack,
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../services/supabase";
import { apiFetch } from "../../services/api";
import type { StoreLeaderboardEntry } from "../../types/api";

export default function AdminStoresScreen() {
  const navigate = useNavigate();
  const [stores, setStores] = useState<StoreLeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const token = (await supabase.auth.getSession()).data.session?.access_token;
      if (!token) return;
      try {
        const data = await apiFetch<StoreLeaderboardEntry[]>(
          "/points/leaderboard/stores",
          token,
        );
        setStores(data);
      } catch {}
      setLoading(false);
    })();
  }, []);

  return (
    <Container maxW="container.lg" py={10}>
      <VStack spacing={6} align="stretch" w="100%">
        <Flex justify="space-between" align="center">
          <Heading size="2xl">🏪 Stores & Points</Heading>
        </Flex>

        {loading ? (
          <Spinner />
        ) : stores.length === 0 ? (
          <Box p={8} textAlign="center" borderWidth="1px" borderRadius="lg">
            <Heading size="md" color="gray.500">
              No stores registered yet
            </Heading>
          </Box>
        ) : (
          <Box borderWidth="1px" borderRadius="lg" overflow="hidden">
            <Table variant="simple">
              <Thead bg="gray.50">
                <Tr>
                  <Th>#</Th>
                  <Th>Store Name</Th>
                  <Th isNumeric>Points</Th>
                  <Th isNumeric>Bags Avoided</Th>
                </Tr>
              </Thead>
              <Tbody>
                {stores.map((s) => (
                  <Tr key={s.id}>
                    <Td fontWeight="bold">#{s.rank}</Td>
                    <Td>{s.name}</Td>
                    <Td isNumeric fontWeight="bold" color="green.600">
                      {s.points_total}
                    </Td>
                    <Td isNumeric color="blue.600">
                      {s.bags_avoided_count ?? 0}
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </Box>
        )}
      </VStack>
    </Container>
  );
}