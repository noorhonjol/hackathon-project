import { Container, Heading, Text, VStack } from "@chakra-ui/react";
import HelloCard from "../../components/HelloCard";

export default function HomePage() {
  return (
    <Container maxW="container.md" centerContent py={10}>
      <VStack spacing={6} align="stretch" w="100%">
        <VStack spacing={2} textAlign="center">
          <Heading size="2xl">Hackathon Hello World</Heading>
          <Text color="gray.500">
            React · TypeScript · Vite · Chakra UI · FastAPI · SQLModel · Postgres
          </Text>
        </VStack>
        <HelloCard />
      </VStack>
    </Container>
  );
}