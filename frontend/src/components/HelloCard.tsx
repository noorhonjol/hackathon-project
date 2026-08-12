import { Box, Heading, Spinner, Text } from "@chakra-ui/react";
import { useHello } from "../hooks/useHello";
import { formatTimestamp } from "../utils/format";

export default function HelloCard() {
  const hello = useHello();

  return (
    <Box p={6} shadow="md" borderWidth="1px" borderRadius="lg">
      <Heading size="md" mb={3}>
        API /hello
      </Heading>
      {hello.isLoading ? (
        <Spinner />
      ) : hello.isError ? (
        <Text color="red.500">Error: {(hello.error as Error).message}</Text>
      ) : (
        <Text fontSize="xl">{hello.data?.message}</Text>
      )}
      {hello.data && (
        <Text fontSize="sm" color="gray.500">
          First seeded: {formatTimestamp(hello.data.created_at)}
        </Text>
      )}
    </Box>
  );
}