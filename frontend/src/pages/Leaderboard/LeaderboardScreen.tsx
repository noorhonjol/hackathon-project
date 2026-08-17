import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Container,
  Flex,
  Heading,
  Spinner,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
  VStack,
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../services/supabase";
import { apiFetch } from "../../services/api";
import type { LeaderboardEntry, StoreLeaderboardEntry } from "../../types/api";

export default function LeaderboardScreen() {
  const navigate = useNavigate();
  const [citizens, setCitizens] = useState<LeaderboardEntry[]>([]);
  const [stores, setStores] = useState<StoreLeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const token = (await supabase.auth.getSession()).data.session?.access_token;
      if (!token) return;
      try {
        const [c, s] = await Promise.all([
          apiFetch<LeaderboardEntry[]>("/points/leaderboard/citizens", token),
          apiFetch<StoreLeaderboardEntry[]>("/points/leaderboard/stores", token),
        ]);
        setCitizens(c);
        setStores(s);
      } catch {}
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <Container centerContent py={20}>
        <Spinner size="xl" />
      </Container>
    );
  }

  return (
    <Container maxW="container.md" py={10}>
      <VStack spacing={4} align="stretch">
        <Heading size="lg">🏆 Leaderboard</Heading>

        <Tabs isFitted>
          <TabList>
            <Tab>Top Citizens</Tab>
            <Tab>Top Stores</Tab>
          </TabList>

          <TabPanels>
            {/* Citizens */}
            <TabPanel px={0}>
              {citizens.length === 0 ? (
                <Text color="gray.500">No citizens yet.</Text>
              ) : (
                <VStack spacing={2} align="stretch">
                  {citizens.map((c) => (
                    <Flex
                      key={c.id}
                      p={3}
                      borderWidth="1px"
                      borderRadius="md"
                      align="center"
                      justify="space-between"
                      bg={c.rank <= 3 ? "yellow.50" : "white"}
                    >
                      <Flex align="center" gap={3}>
                        <Text
                          fontWeight="bold"
                          fontSize="lg"
                          color={c.rank === 1 ? "yellow.500" : c.rank === 2 ? "gray.400" : c.rank === 3 ? "orange.500" : "gray.500"}
                        >
                          #{c.rank}
                        </Text>
                        <Text fontWeight="bold">{c.display_name ?? "Unknown"}</Text>
                      </Flex>
                      <Text fontWeight="bold" color="green.600">
                        {c.points_total} pts
                      </Text>
                    </Flex>
                  ))}
                </VStack>
              )}
            </TabPanel>

            {/* Stores */}
            <TabPanel px={0}>
              {stores.length === 0 ? (
                <Text color="gray.500">No stores registered yet.</Text>
              ) : (
                <VStack spacing={2} align="stretch">
                  {stores.map((s) => (
                    <Flex
                      key={s.id}
                      p={3}
                      borderWidth="1px"
                      borderRadius="md"
                      align="center"
                      justify="space-between"
                      bg={s.rank <= 3 ? "yellow.50" : "white"}
                    >
                      <Flex align="center" gap={3}>
                        <Text
                          fontWeight="bold"
                          fontSize="lg"
                          color={s.rank === 1 ? "yellow.500" : s.rank === 2 ? "gray.400" : s.rank === 3 ? "orange.500" : "gray.500"}
                        >
                          #{s.rank}
                        </Text>
                        <Text fontWeight="bold">{s.name}</Text>
                      </Flex>
                      <Text fontWeight="bold" color="green.600">
                        {s.points_total} pts
                      </Text>
                    </Flex>
                  ))}
                </VStack>
              )}
            </TabPanel>
          </TabPanels>
        </Tabs>

        <Button mt={4} onClick={() => navigate(-1)}>
          Back
        </Button>
      </VStack>
    </Container>
  );
}