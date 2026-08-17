import { useEffect, useState } from "react";
import { Box, Spinner, Text } from "@chakra-ui/react";
import { supabase } from "../services/supabase";
import { apiFetch } from "../services/api";

export default function StoreBagsStatus({ storeId }: { storeId: string }) {
  const [status, setStatus] = useState<{ at_store: number; with_users: number } | null>(null);

  useEffect(() => {
    (async () => {
      const token = (await supabase.auth.getSession()).data.session?.access_token;
      if (!token) return;
      try {
        const data = await apiFetch<{ at_store: number; with_users: number }>(
          `/stores/${storeId}/bags-status`,
          token,
        );
        setStatus(data);
      } catch {}
    })();
  }, [storeId]);

  if (!status) return null;

  return (
    <Box p={4} borderWidth="1px" borderRadius="lg" bg="blue.50">
      <Text fontWeight="bold" mb={1}>🛍️ Bag Circulation</Text>
      <Text fontSize="sm">
        <strong>{status.at_store}</strong> bags at store — waiting for customers
      </Text>
      <Text fontSize="sm">
        <strong>{status.with_users}</strong> bags with customers — pending return
      </Text>
    </Box>
  );
}