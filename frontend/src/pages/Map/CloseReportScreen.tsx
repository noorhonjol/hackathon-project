import { useState } from "react";
import {
  Box,
  Button,
  Container,
  Heading,
  Text,
  VStack,
  useToast,
} from "@chakra-ui/react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../../services/supabase";

export default function CloseReportScreen() {
  const navigate = useNavigate();
  const toast = useToast();
  const location = useLocation();
  const reportId = (location.state as { reportId: string } | null)?.reportId;
  const [photo, setPhoto] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = () => setPhoto(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleClose = async () => {
    setSubmitting(true);
    const token = (await supabase.auth.getSession()).data.session?.access_token;
    if (!token) return;
    try {
      const formData = new FormData();
      if (photoFile) formData.append("photo", photoFile);
      const res = await fetch(`/api/reports/${reportId}/close`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (!res.ok) throw new Error((await res.text()) || `HTTP ${res.status}`);
      toast({ title: "✅ Event closed!", status: "success" });
      navigate("/map", { replace: true });
    } catch (err) {
      toast({ title: (err as Error).message, status: "error" });
    }
    setSubmitting(false);
  };

  if (!reportId) {
    return (
      <Container centerContent py={20}>
        <Text>No report specified.</Text>
        <Button mt={4} onClick={() => navigate("/map")}>Back</Button>
      </Container>
    );
  }

  return (
    <Container maxW="sm" centerContent py={10}>
      <VStack spacing={6} w="100%">
        <Heading size="lg">Close Cleanup Event</Heading>
        <Text color="gray.500" textAlign="center">
          Optionally add an after-photo to show the cleaned area
        </Text>
        <Box w="100%" maxW="300px" h="250px" borderWidth="2px" borderStyle="dashed" borderRadius="lg" display="flex" alignItems="center" justifyContent="center" bg={photo ? "transparent" : "gray.50"} overflow="hidden">
          {photo ? (
            <img src={photo} alt="After" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <Text color="gray.400">Optional after-photo</Text>
          )}
        </Box>
        <Button as="label" htmlFor="close-camera" colorScheme="blue" w="100%">
          {photo ? "📷 Change Photo" : "📷 Add After-Photo (optional)"}
          <input id="close-camera" type="file" accept="image/*" capture="environment" style={{ display: "none" }} onChange={handleFileChange} />
        </Button>
        <Button colorScheme="orange" w="100%" isLoading={submitting} onClick={handleClose}>
          Close Event
        </Button>
        <Button variant="ghost" onClick={() => navigate("/map")}>Cancel</Button>
      </VStack>
    </Container>
  );
}