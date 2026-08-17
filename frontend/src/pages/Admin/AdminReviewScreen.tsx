import { useCallback, useEffect, useState } from "react";
import {
  Box,
  Button,
  Container,
  Flex,
  Grid,
  Heading,
  Image,
  Spinner,
  Text,
  VStack,
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { supabase } from "../../services/supabase";
import { apiFetch } from "../../services/api";
import type { ProfileResponse } from "../../types/api";

interface ReportItem {
  id: string;
  reporter_name: string | null;
  status: string;
  photo_before_url: string;
  created_at: string;
}

const STATUS_BADGE: Record<string, { label: string; color: string }> = {
  pending_review: { label: "Pending", color: "yellow" },
  open: { label: "Open", color: "blue" },
  in_progress: { label: "In Progress", color: "orange" },
  completed: { label: "Completed", color: "green" },
  rejected: { label: "Rejected", color: "red" },
};

export default function AdminReviewScreen() {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const getToken = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token;
  }, []);

  useEffect(() => {
    (async () => {
      const token = await getToken();
      if (!token) return;
      try {
        const p = await apiFetch<ProfileResponse>("/profile/me", token);
        setProfile(p);
      } catch { setError("Not authenticated"); }
    })();
  }, [getToken]);

  const fetchReports = useCallback(async () => {
    const token = await getToken();
    if (!token) return;
    try {
      const data = await apiFetch<ReportItem[]>("/admin/reports/pending", token);
      setReports(data);
    } catch { setReports([]); }
    setLoading(false);
  }, [getToken]);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  const handleAction = async (reportId: string, action: string) => {
    const token = await getToken();
    if (!token) return;
    try {
      await apiFetch(`/admin/reports/${reportId}/${action}`, token, { method: "POST" });
      fetchReports();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/login", { replace: true });
  };

  if (!profile) return <Container centerContent py={20}><Spinner size="xl" /></Container>;
  if (profile.role !== "admin")
    return (
      <Container centerContent py={20}>
        <Heading size="lg" color="red.500">Access Denied</Heading>
        <Text>You need admin privileges.</Text>
      </Container>
    );

  return (
    <Container maxW="container.lg" py={10}>
      <VStack spacing={6} align="stretch" w="100%">
        <Flex justify="space-between" align="center">
          <Heading size="2xl">Admin Panel ({reports.length})</Heading>
          <Button colorScheme="red" size="sm" onClick={handleSignOut}>Sign Out</Button>
        </Flex>

        {error && <Text color="red.500" fontSize="sm">{error}</Text>}

        {loading ? <Spinner /> : reports.length === 0 ? (
          <Box p={8} textAlign="center" borderWidth="1px" borderRadius="lg">
            <Text color="gray.500" fontSize="lg">No reports</Text>
          </Box>
        ) : (
          <Grid templateColumns="repeat(auto-fill, minmax(340px, 1fr))" gap={4}>
            {reports.map((r) => {
              const badge = STATUS_BADGE[r.status] ?? { label: r.status, color: "gray" };
              return (
                <Box key={r.id} borderWidth="1px" borderRadius="lg" overflow="hidden" shadow="sm">
                  {r.photo_before_url && (
                    <Image
                      src={r.photo_before_url}
                      alt="Report"
                      h="150px" w="100%" objectFit="cover"
                      fallback={<Box h="150px" bg="gray.100" />}
                    />
                  )}
                  <Box p={4}>
                    <Flex justify="space-between" align="center" mb={2}>
                      <Text fontSize="xs" fontWeight="bold" textTransform="uppercase"
                        color={`${badge.color}.600`} bg={`${badge.color}.50`}
                        px={2} py={1} borderRadius="full">
                        {badge.label}
                      </Text>
                      <Text fontSize="xs" color="gray.500">
                        {new Date(r.created_at).toLocaleDateString()}
                      </Text>
                    </Flex>
                    <Text fontWeight="bold">{r.reporter_name ?? "Unknown"}</Text>

                    <Flex gap={2} mt={3} wrap="wrap">
                      {r.status === "pending_review" && (
                        <>
                          <Button colorScheme="green" size="sm" flex={1} onClick={() => handleAction(r.id, "approve")}>✅ Approve</Button>
                          <Button colorScheme="red" size="sm" flex={1} onClick={() => handleAction(r.id, "reject")}>❌ Reject</Button>
                        </>
                      )}
                      {r.status === "rejected" && (
                        <Button colorScheme="green" size="sm" w="100%" onClick={() => handleAction(r.id, "approve")}>✅ Re-approve</Button>
                      )}
                      {r.status === "open" && (
                        <Button colorScheme="orange" size="sm" w="100%" onClick={() => handleAction(r.id, "start")}>▶️ Start Event</Button>
                      )}
                      {r.status === "in_progress" && (
                        <>
                          <Button colorScheme="blue" size="sm" flex={1} onClick={() => navigate(`/reports/${r.id}`)}>👁️ View</Button>
                          <Button colorScheme="orange" size="sm" onClick={() => handleAction(r.id, "close")}>🔒 Close</Button>
                        </>
                      )}
                      {r.status === "completed" && (
                        <Button colorScheme="blue" size="sm" w="100%" onClick={() => navigate(`/reports/${r.id}`)}>👁️ View Details</Button>
                      )}
                    </Flex>
                  </Box>
                </Box>
              );
            })}
          </Grid>
        )}
      </VStack>
    </Container>
  );
}