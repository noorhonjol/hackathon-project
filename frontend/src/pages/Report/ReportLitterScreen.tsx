import { useState } from "react";
import {
  Box,
  Button,
  Container,
  Heading,
  Text,
  VStack,
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";

export default function ReportLitterScreen() {
  const navigate = useNavigate();
  const [photo, setPhoto] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [location, setLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [locError, setLocError] = useState("");
  const [locating, setLocating] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = () => setPhoto(reader.result as string);
    reader.readAsDataURL(file);

    // Request geolocation
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        setLocating(false);
      },
      (err) => {
        setLocError(`Could not get location: ${err.message}`);
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const handleNext = () => {
    if (!photoFile || !location) return;
    navigate("/report/confirm", {
      state: { photoFile, photo, location },
    });
  };

  return (
    <Container maxW="sm" centerContent py={10}>
      <VStack spacing={6} w="100%">
        <VStack spacing={2} textAlign="center">
          <Heading size="lg">Report Litter</Heading>
          <Text color="gray.500">
            Take a photo of the litter you want to report
          </Text>
        </VStack>

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
            <img
              src={photo}
              alt="Captured litter"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            <Text color="gray.400">Tap to take a photo</Text>
          )}
        </Box>

        <Button as="label" htmlFor="camera-input" colorScheme="blue" w="100%">
          {photo ? "📷 Retake Photo" : "📷 Take Photo"}
          <input
            id="camera-input"
            type="file"
            accept="image/*"
            capture="environment"
            style={{ display: "none" }}
            onChange={handleFileChange}
          />
        </Button>

        {locating && (
          <Text fontSize="sm" color="gray.500">
            Getting your location...
          </Text>
        )}
        {locError && (
          <Text fontSize="sm" color="red.500">
            {locError}
          </Text>
        )}
        {location && (
          <Text fontSize="sm" color="green.600">
            📍 Location captured
          </Text>
        )}

        <Button
          colorScheme="green"
          w="100%"
          isDisabled={!photoFile || !location}
          onClick={handleNext}
        >
          Next
        </Button>
      </VStack>
    </Container>
  );
}