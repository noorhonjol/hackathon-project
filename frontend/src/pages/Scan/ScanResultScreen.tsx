import { useEffect } from "react";
import { Box, Button, Container, Heading, Text, VStack } from "@chakra-ui/react";
import { useLocation, useNavigate } from "react-router-dom";
import type { ScanResponse } from "../../types/api";

interface ResultState {
  result?: ScanResponse;
  error?: string;
}

export default function ScanResultScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as ResultState | null;

  const result = state?.result;
  const error = state?.error;

  // If store owner scanned, redirect to citizen view (available bags)
  useEffect(() => {
    if (result?.success) {
      const timer = setTimeout(() => navigate("/", { replace: true }), 2000);
      return () => clearTimeout(timer);
    }
  }, [result, navigate]);

  return (
    <Container maxW="sm" centerContent py={20}>
      <Box
        w="100%"
        p={8}
        borderWidth="1px"
        borderRadius="lg"
        shadow="md"
        textAlign="center"
      >
        <VStack spacing={4}>
          {error ? (
            <>
              <Heading size="xl">😕</Heading>
              <Heading size="lg" color="red.500">
                Scan Failed
              </Heading>
              <Text>{error}</Text>
            </>
          ) : result?.success ? (
            <>
              <Heading size="xl">🎉</Heading>
              <Heading size="lg" color="green.500">
                +{result.points_awarded} Points!
              </Heading>
              <Text>
                Thanks for skipping the plastic bag at{" "}
                <strong>{result.store_name}</strong>!
              </Text>
              {result.capped && (
                <Text color="orange.500" fontSize="sm">
                  Daily cap reached — you earned what you could today
                </Text>
              )}
            </>
          ) : result && !result.success ? (
            <>
              <Heading size="xl">😕</Heading>
              <Heading size="lg" color="orange.500">
                Daily Cap Reached
              </Heading>
              <Text>
                You scanned at <strong>{result.store_name}</strong>, but
                you&apos;ve hit your daily point limit.
              </Text>
            </>
          ) : (
            <>
              <Heading size="lg">Unknown Result</Heading>
              <Text>Something unexpected happened.</Text>
            </>
          )}

          <Button
            colorScheme="blue"
            mt={4}
            onClick={() => navigate("/citizen", { replace: true })}
          >
            Back to Dashboard
          </Button>
        </VStack>
      </Box>
    </Container>
  );
}