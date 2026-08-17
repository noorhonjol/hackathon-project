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

export default function ReportCleanScreen() {
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

  const handleSubmit = async () => {
    if (!photoFile || !reportId) return;
    setSubmitting(true);

    const token = (await supabase.auth.getSession()).data.session?.access_token;
    if (!token) return;

    try {
      const formData = new FormData();
      formData.append("photo", photoFile);

      const res = await fetch(`/api/reports/${reportId}/clean`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!res.ok) throw new Error((await res.text()) || `HTTP ${res.status}`);

      toast({ title: "✅ Area marked as cleaned! +15 points", status: "success" });
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
        <Button mt={4} onClick={() => navigate("/map")}>Back to Map</Button>
      </Container>
    );
  }

  return (
    <Container maxW="sm" centerContent py={10}>
      <VStack spacing={6} w="100%">
        <Heading size="lg">📸 Show the Cleaned Area</Heading>
        <Text color="gray.500" textAlign="center">
          Take a photo of the area after you&apos;ve cleaned it up
        </Text>

        <Box
          w="100%"
          maxW="300px"
          h="250px"
          borderWidth="2px"
          borderStyle="dashed"
          borderRadius="lg"
          display="flex"
          alignItems="center"
          justifyContent="center"
          bg={photo ? "transparent" : "gray.50"}
          overflow="hidden"
        >
          {photo ? (
            <img src={photo} alt="Cleaned" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <Text color="gray.400">Tap to take an after-photo</Text>
          )}
        </Box>

        <Button as="label" htmlFor="clean-camera" colorScheme="blue" w="100%">
          {photo ? "📷 Retake" : "📷 Take After-Photo"}
          <input id="clean-camera" type="file" accept="image/*" capture="environment" style={{ display: "none" }} onChange={handleFileChange} />
        </Button>

        <Button colorScheme="green" w="100%" isDisabled={!photoFile} isLoading={submitting} onClick={handleSubmit}>
          Submit Cleaned Report
        </Button>
      </VStack>
    </Container>
  );
}