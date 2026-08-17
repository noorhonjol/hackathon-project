import { useEffect, useState, useRef, useCallback } from "react";
import {
  Box,
  Button,
  Container,
  Flex,
  Heading,
  Image,
  Spinner,
  Text,
  VStack,
  useToast,
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../services/supabase";
import { apiFetch } from "../../services/api";
import type { ProfileResponse } from "../../types/api";

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
  status: "open" | "in_progress" | "completed";
  contributor_count: number;
  contributors: Contributor[];
  created_at: string;
}

const STATUS_BADGES: Record<string, { label: string; color: string }> = {
  open: { label: "Open", color: "red" },
  in_progress: { label: "In Progress", color: "yellow" },
  completed: { label: "Completed", color: "green" },
};

export default function ReportFeedScreen() {
  const navigate = useNavigate();
  const toast = useToast();
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const fetchReports = useCallback(async (pageNum: number, append: boolean) => {
    const token = (await supabase.auth.getSession()).data.session?.access_token;
    if (!token) return;
    try {
      const data = await apiFetch<ReportItem[]>(
        `/reports?page=${pageNum}&per_page=5`,
        token,
      );
      if (append) {
        setReports((prev) => [...prev, ...data]);
      } else {
        setReports(data);
      }
      setHasMore(data.length === 5);
    } catch {}
    setLoading(false);
    setLoadingMore(false);
  }, []);

  // Initial load
  useEffect(() => {
    (async () => {
      const token = (await supabase.auth.getSession()).data.session?.access_token;
      if (!token) return;
      try {
        const p = await apiFetch<ProfileResponse>("/profile/me", token);
        setProfile(p);
      } catch {}
      fetchReports(1, false);
    })();
  }, [fetchReports]);

  // Infinite scroll via Intersection Observer
  useEffect(() => {
    if (!hasMore || loadingMore) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          setLoadingMore(true);
          setPage((prev) => {
            const next = prev + 1;
            fetchReports(next, true);
            return next;
          });
        }
      },
      { threshold: 0.1 },
    );
    const el = sentinelRef.current;
    if (el) observer.observe(el);
    return () => {
      if (el) observer.unobserve(el);
    };
  }, [hasMore, loadingMore, fetchReports]);

  const myContrib = (report: ReportItem) => {
    if (!profile) return null;
    return report.contributors.find((c) => c.profile_id === profile.id) ?? null;
  };

  const handleJoin = async (reportId: string) => {
    const token = (await supabase.auth.getSession()).data.session?.access_token;
    if (!token) return;
    try {
      const res = await apiFetch<{ id: string; report_status: string }>(
        `/reports/${reportId}/join`, token, { method: "POST" },
      );
      toast({ title: "Joined cleanup!", status: "success" });
      setReports((prev) =>
        prev.map((r) =>
          r.id === reportId
            ? { ...r, status: res.report_status as ReportItem["status"], contributor_count: r.contributor_count + 1, contributors: [...r.contributors, { profile_id: profile!.id, display_name: profile!.display_name, status: "joined" as const, photo_after_url: null }] }
            : r,
        ),
      );
    } catch (err) {
      toast({ title: (err as Error).message, status: "error" });
    }
  };

  const handleClose = async (reportId: string) => {
    const token = (await supabase.auth.getSession()).data.session?.access_token;
    if (!token) return;
    try {
      await apiFetch(`/reports/${reportId}/close`, token, { method: "POST" });
      toast({ title: "Event closed!", status: "success" });
      setReports((prev) =>
        prev.map((r) => (r.id === reportId ? { ...r, status: "completed" as const } : r)),
      );
    } catch (err) {
      toast({ title: (err as Error).message, status: "error" });
    }
  };

  return (
    <Container maxW="container.md" py={4}>
      <VStack spacing={4} align="stretch" w="100%">
        <Flex justify="space-between" align="center">
          <Heading size="lg">📋 Cleanup Feed</Heading>
          <Button size="sm" onClick={() => navigate("/citizen")}>Back</Button>
        </Flex>

        {loading ? (
          <Spinner />
        ) : reports.length === 0 ? (
          <Text color="gray.500" textAlign="center" py={10}>No cleanups yet.</Text>
        ) : (
          <>
            {reports.map((r) => {
              const badge = STATUS_BADGES[r.status] ?? { label: r.status, color: "gray" };
              const mc = myContrib(r);
              return (
                <Box key={r.id} borderWidth="1px" borderRadius="lg" overflow="hidden" shadow="sm">
                  {/* Photo (clickable to detail page) */}
                  {r.photo_before_url && (
                    <Box position="relative" onClick={() => navigate(`/reports/${r.id}`)} cursor="pointer">
                      <Image
                        src={r.photo_before_url}
                        alt="Cleanup"
                        h="200px"
                        w="100%"
                        objectFit="cover"
                        fallback={<Box h="200px" bg="gray.100" />}
                      />
                      <Text position="absolute" bottom={2} right={2} fontSize="xs" bg="blackAlpha.700" color="white" px={2} py={1} borderRadius="md">
                        View Details →
                      </Text>
                    </Box>
                  )}

                  <Box p={4}>
                    {/* Status badge */}
                    <Flex justify="space-between" align="center" mb={2}>
                      <Text
                        fontSize="xs"
                        fontWeight="bold"
                        textTransform="uppercase"
                        color={`${badge.color}.600`}
                        bg={`${badge.color}.50`}
                        px={2}
                        py={1}
                        borderRadius="full"
                      >
                        {badge.label}
                      </Text>
                      <Text fontSize="xs" color="gray.500">
                        {new Date(r.created_at).toLocaleDateString()}
                      </Text>
                    </Flex>

                    {/* Contributor count */}
                    <Text fontSize="sm" color="gray.600" mb={2}>
                      {r.contributor_count} {r.contributor_count === 1 ? "person" : "people"} contributing
                    </Text>

                    {/* Contributors */}
                    {r.contributors.length > 0 && (
                      <Box fontSize="sm" mb={2}>
                        {r.contributors.map((c) => (
                          <Text key={c.profile_id}>
                            {c.status === "completed" ? "✅" : "⏳"} {c.display_name ?? "Anonymous"}
                          </Text>
                        ))}
                      </Box>
                    )}

                    {/* Gallery — removed from feed, shown on detail page */}

                    {/* Actions */}
                    {r.status === "open" && !mc && (
                      <Button size="sm" colorScheme="blue" w="100%" onClick={() => handleJoin(r.id)}>
                        Join This Cleanup
                      </Button>
                    )}
                    {r.status === "open" && mc && (
                      <Text fontSize="sm" color="blue.600">⏳ Signed up — waiting for event to start</Text>
                    )}
                    {r.status === "in_progress" && mc?.status === "joined" && (
                      <Button size="sm" colorScheme="green" w="100%" onClick={() => navigate("/reports/contribute", { state: { reportId: r.id } })}>
                        Upload My Cleanup Photo
                      </Button>
                    )}
                    {mc?.status === "completed" && (
                      <Text fontSize="sm" color="green.600">You've contributed ✓</Text>
                    )}
                  </Box>
                </Box>
              );
            })}

            {/* Infinite scroll sentinel */}
            <div ref={sentinelRef} style={{ height: 1 }} />
            {loadingMore && <Spinner />}
            {!hasMore && (
              <Text fontSize="sm" color="gray.500" textAlign="center" py={4}>
                All cleanups loaded
              </Text>
            )}
          </>
        )}
      </VStack>
    </Container>
  );
}