import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Container,
  Flex,
  Heading,
  Image,
  SimpleGrid,
  Spinner,
  Text,
  VStack,
} from "@chakra-ui/react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../../services/supabase";
import { apiFetch } from "../../services/api";

interface Contributor {
  profile_id: string;
  display_name: string | null;
  status: "joined" | "completed";
  photo_after_url: string | null;
}

interface ReportItem {
  id: string;
  reporter_id: string;
  reporter_name: string | null;
  lat: number;
  lng: number;
  photo_before_url: string;
  photo_after_url: string | null;
  status: string;
  contributor_count: number;
  contributors: Contributor[];
  created_at: string;
}

const STATUS_COLORS: Record<string, string> = {
  pending_review: "yellow", open: "blue", in_progress: "orange", completed: "green", rejected: "red",
};

export default function ReportDetailScreen() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [report, setReport] = useState<ReportItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const token = (await supabase.auth.getSession()).data.session?.access_token;
      if (!token) return;
      try {
        const reports = await apiFetch<ReportItem[]>("/reports", token);
        const r = reports.find((r) => r.id === id);
        setReport(r ?? null);
      } catch {}
      setLoading(false);
    })();
  }, [id]);

  if (loading) return <Container centerContent py={20}><Spinner size="xl" /></Container>;
  if (!report) return <Container centerContent py={20}><Text>Report not found</Text></Container>;

  const color = STATUS_COLORS[report.status] ?? "gray";
  const completed = report.contributors.filter((c) => c.status === "completed" && c.photo_after_url);

  return (
    <Container maxW="container.md" py={10}>
      <VStack spacing={6} align="stretch">
        <Flex justify="space-between" align="center">
          <Heading size="lg">Cleanup Event</Heading>
          <Button size="sm" onClick={() => navigate(-1)}>Back</Button>
        </Flex>

        {/* Status */}
        <Box p={4} borderWidth="1px" borderRadius="lg" bg={`${color}.50`}>
          <Text fontWeight="bold" textTransform="capitalize" fontSize="lg">
            Status: {report.status.replace("_", " ")}
          </Text>
          <Text fontSize="sm" color="gray.600">📝 Reported by: {report.reporter_name ?? "Anonymous"}</Text>
          <Text fontSize="sm" color="gray.600">📍 {report.lat.toFixed(4)}, {report.lng.toFixed(4)}</Text>
          <Text fontSize="sm" color="gray.600">{report.contributor_count} contributors</Text>
          {report.contributors.map((c) => (
            <Text key={c.profile_id} fontSize="sm">
              {c.status === "completed" ? "✅" : "⏳"} {c.display_name ?? "Anonymous"}
            </Text>
          ))}
        </Box>

        {/* Before photo */}
        <Box>
          <Heading size="md" mb={3}>📸 Before</Heading>
          {report.photo_before_url && (
            <Image src={report.photo_before_url} alt="Before" borderRadius="lg" w="100%" fallback={<Box h="300px" bg="gray.100" borderRadius="lg" />} />
          )}
        </Box>

        {/* After photos gallery */}
        {completed.length > 0 && (
          <Box>
            <Heading size="md" mb={3}>
              ✅ After ({completed.length} {completed.length === 1 ? "photo" : "photos"})
            </Heading>
            <SimpleGrid columns={[1, 2]} gap={4}>
              {completed.map((c) => (
                <Box key={c.profile_id} borderWidth="1px" borderRadius="lg" overflow="hidden">
                  <Image src={c.photo_after_url!} alt="Cleanup" w="100%" h="250px" objectFit="cover" fallback={<Box h="250px" bg="gray.100" />} />
                  <Box p={2}>
                    <Text fontSize="sm" fontWeight="bold">{c.display_name ?? "Anonymous"}</Text>
                  </Box>
                </Box>
              ))}
            </SimpleGrid>
          </Box>
        )}
      </VStack>
    </Container>
  );
}