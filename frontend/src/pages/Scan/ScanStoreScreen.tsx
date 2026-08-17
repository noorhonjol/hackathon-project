import { useRef, useState } from "react";
import { Box, Button, Container, Heading, Text, VStack } from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { Html5Qrcode } from "html5-qrcode";
import { supabase } from "../../services/supabase";
import { apiFetch } from "../../services/api";
import type { ScanResponse } from "../../types/api";

export default function ScanStoreScreen() {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  const processQR = async (decodedText: string) => {
    const token = (await supabase.auth.getSession()).data.session?.access_token;
    if (!token) return;
    try {
      const result = await apiFetch<ScanResponse>("/bags/scan", token, {
        method: "POST",
        body: JSON.stringify({ qr_code: decodedText }),
      });
      // Check role to decide where to redirect
      const profile = await apiFetch<{ role: string }>("/profile/me", token);
      if (profile.role === "store_owner") {
        navigate("/store", { replace: true });
      } else {
        navigate("/scan/result", { state: { result } });
      }
    } catch (err) {
      navigate("/scan/result", { state: { error: (err as Error).message } });
    }
  };

  const decodeFile = async (file: File) => {
    setProcessing(true);
    setError("");

    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(file);

    try {
      const html5Qr = new Html5Qrcode("qr-preview");
      const decoded = await html5Qr.scanFile(file, true);
      processQR(decoded);
    } catch {
      setError("Could not read QR code. Try a clearer photo.");
      setProcessing(false);
    }
  };

  const handleCameraCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) await decodeFile(file);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) await decodeFile(file);
  };

  return (
    <Container maxW="sm" centerContent py={10}>
      <VStack spacing={6} w="100%">
        <Heading size="lg">Scan Bag QR</Heading>
        <Text color="gray.500" textAlign="center">
          Take a photo or upload an image of the reusable bag's QR code
        </Text>

        {/* Preview */}
        {preview && (
          <Box w="100%" maxW="300px" h="200px" borderRadius="lg" overflow="hidden">
            <img src={preview} alt="QR" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
          </Box>
        )}

        {error && (
          <Text color="red.500" fontSize="sm" textAlign="center">
            {error}
          </Text>
        )}

        <Box id="qr-preview" style={{ display: "none" }} />

        <VStack spacing={3} w="100%">
          {/* Take photo with camera */}
          <Button
            colorScheme="blue"
            w="100%"
            size="lg"
            isLoading={processing}
            onClick={() => cameraRef.current?.click()}
          >
            📷 Take Photo
          </Button>
          <input
            ref={cameraRef}
            type="file"
            accept="image/*"
            capture="environment"
            style={{ display: "none" }}
            onChange={handleCameraCapture}
          />

          {/* Upload from gallery */}
          <Button
            variant="outline"
            w="100%"
            size="lg"
            isLoading={processing}
            onClick={() => fileRef.current?.click()}
          >
            📁 Upload Image
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={handleFileUpload}
          />
        </VStack>
      </VStack>
    </Container>
  );
}