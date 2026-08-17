import { useEffect, useState } from "react";
import { Box, Heading, Spinner, Text, VStack } from "@chakra-ui/react";
import { supabase } from "../services/supabase";
import { apiFetch } from "../services/api";
import type { StoreLeaderboardEntry } from "../types/api";

export default function StoreLeaderboardSnippet() {
  const [stores, setStores] = useState<StoreLeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const token = (await supabase.auth.getSession()).data.session?.access_token;
      if (!token) return;
      try {
        const data = await apiFetch<StoreLeaderboardEntry[]>(
          "/points/leaderboard/stores/top5",
          token,
        );
        setStores(data);
      } catch {}
      setLoading(false);
    })();
  }, []);

  if (loading) return null;

  return (
    <Box p={4} borderWidth="1px" borderRadius="lg">
      <Heading size="sm" mb={3}>
        🏆 Top Stores
      </Heading>
      {stores.length === 0 ? (
        <Text fontSize="sm" color="gray.500">
          No stores yet
        </Text>
      ) : (
        <VStack spacing={1} align="stretch">
          {stores.map((s) => (
            <Text key={s.id} fontSize="sm">
              <strong>#{s.rank}</strong> {s.name} — {s.points_total} pts
            </Text>
          ))}
        </VStack>
      )}
    </Box>
  );
}