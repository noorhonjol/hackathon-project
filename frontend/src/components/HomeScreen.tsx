import { Box, Button, Container, Heading, Text, VStack } from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";

// Palestinian flag colors bar
function FlagBar() {
  return (
    <Box w="100%" h="6px" display="flex" borderRadius="full" overflow="hidden">
      <Box flex={1} bg="#E4312B" />
      <Box flex={1} bg="#1C1C1C" />
      <Box flex={1} bg="#FFFFFF" borderX="1px solid" borderColor="gray.200" />
      <Box flex={1} bg="#149954" />
    </Box>
  );
}

interface HomeScreenProps {
  role: "citizen" | "store_owner" | "admin";
  displayName: string | null;
  pointsTotal: number;
  children: React.ReactNode;
  onSignOut: () => void;
}

export default function HomeScreen({ role, displayName, pointsTotal, children, onSignOut }: HomeScreenProps) {
  const navigate = useNavigate();

  const roleIcon = role === "citizen" ? "🌱" : role === "store_owner" ? "🏪" : "⚙️";
  const roleLabel = role === "citizen" ? "Citizen" : role === "store_owner" ? "Store Owner" : "Admin";

  return (
    <Container maxW="container.md" py={6}>
      <VStack spacing={6} align="stretch" w="100%">
        <FlagBar />

        {/* Header */}
        <Box textAlign="center">
          <Heading size="2xl" color="palestine.red">
            {roleIcon} Qoffa
          </Heading>
          <Text color="palestine.green" fontWeight="bold" fontSize="lg" mt={1}>
            {roleLabel} — {displayName ?? "User"}
          </Text>
          <Text fontSize="sm" color="gray.500">Points: {pointsTotal}</Text>
        </Box>

        {/* Main content */}
        {children}

        {/* Bottom nav */}
        <Box pt={4} borderTop="1px solid" borderColor="gray.100">
          <VStack spacing={2}>
            {role === "citizen" && (
              <>
                <Button w="100%" variant="outline" onClick={() => navigate("/map")}>
                  📋 Cleanup Feed
                </Button>
                <Button w="100%" variant="outline" onClick={() => navigate("/points/history")}>
                  📊 Points History
                </Button>
                <Button w="100%" variant="outline" onClick={() => navigate("/leaderboard")}>
                  🏆 Leaderboard
                </Button>
              </>
            )}
            <Button w="100%" colorScheme="red" variant="ghost" onClick={onSignOut}>
              Sign Out
            </Button>
          </VStack>
        </Box>
      </VStack>
    </Container>
  );
}