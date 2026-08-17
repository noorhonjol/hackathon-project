import { Box, Button, Container, Heading, Text, VStack } from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";

export default function ReportSubmittedScreen() {
  const navigate = useNavigate();

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
          <Heading size="xl">✅</Heading>
          <Heading size="lg" color="green.500">
            Report Submitted!
          </Heading>
          <Text>
            Thanks! Your report is pending admin review. We&apos;ll notify you
            when it&apos;s processed.
          </Text>

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