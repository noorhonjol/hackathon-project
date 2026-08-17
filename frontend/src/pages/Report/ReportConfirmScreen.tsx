import { useState } from "react";
import {
  Box,
  Button,
  Container,
  Heading,
  Spinner,
  Text,
  VStack,
} from "@chakra-ui/react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../../services/supabase";
import { apiFetch } from "../../services/api";

interface ConfirmState {
  photoFile: File;
  photo: string;
  location: { lat: number; lng: number };
}

export default function ReportConfirmScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as ConfirmState | null;
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (!state) {
    return <Navigate to="/report" replace />;
  }

  const { photoFile, photo } = state;
  const { lat, lng } = state.location;

  const handleSubmit = async () => {
    setSubmitting(true);
    setError("");

    const {
      data: { session },
    } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!token) return;

    try {
      const formData = new FormData();
      formData.append("photo", photoFile);
      formData.append("lat", String(lat));
      formData.append("lng", String(lng));

      const res = await fetch(`/api/reports`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `HTTP ${res.status}`);
      }

      navigate("/report/submitted", { replace: true });
    } catch (err) {
      setError((err as Error).message);
    }
    setSubmitting(false);
  };

  return (
    <Container maxW="sm" centerContent py={10}>
      <VStack spacing={6} w="100%">
        <Heading size="lg">Confirm Report</Heading>

        <Box
          w="100%"
          maxW="300px"
          h="200px"
          borderRadius="lg"
          overflow="hidden"
        >
          <img
            src={photo}
            alt="Litter to report"
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        </Box>

        <Box p={4} borderWidth="1px" borderRadius="lg" w="100%">
          <Text>
            <strong>📍 Location:</strong> {lat.toFixed(4)}, {lng.toFixed(4)}
          </Text>
          <Text fontSize="sm" color="gray.500">
            This report will be submitted for admin review.
          </Text>
        </Box>

        {error && (
          <Text color="red.500" fontSize="sm">
            {error}
          </Text>
        )}

        <Button
          colorScheme="green"
          w="100%"
          isLoading={submitting}
          onClick={handleSubmit}
        >
          Submit Report
        </Button>

        <Button
          variant="ghost"
          onClick={() => navigate("/report", { replace: true })}
        >
          Back
        </Button>
      </VStack>
    </Container>
  );
}

function Navigate({ to, replace }: { to: string; replace?: boolean }) {
  const navigate = useNavigate();
  navigate(to, { replace });
  return null;
}