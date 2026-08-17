import { useState } from "react";
import {
  Box,
  Button,
  Container,
  FormControl,
  FormErrorMessage,
  Heading,
  Input,
  Text,
  VStack,
} from "@chakra-ui/react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { supabase } from "../../services/supabase";
import { apiFetch } from "../../services/api";
import type { ProfileResponse } from "../../types/api";

export default function NameEntryScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const role = (location.state as { role: string } | null)?.role ?? "citizen";

  const [displayName, setDisplayName] = useState("");
  const [shopName, setShopName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate("/login", { replace: true });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) throw new Error("Not authenticated");

      await apiFetch<ProfileResponse>("/profile/role", token, {
        method: "PATCH",
        body: JSON.stringify({
          role,
          display_name: displayName,
        }),
      });

      // Navigate to the correct home screen
      if (role === "citizen") {
        navigate("/citizen", { replace: true });
      } else {
        navigate("/store", { replace: true });
      }
    } catch (err) {
      setError((err as Error).message);
    }
    setLoading(false);
  };

  return (
    <Container maxW="sm" centerContent py={20}>
      <Box w="100%" p={8} borderWidth="1px" borderRadius="lg" shadow="md">
        <form onSubmit={handleSubmit}>
          <VStack spacing={4}>
            <Heading size="lg">
              {role === "citizen" ? "Tell us about yourself" : "Tell us about your shop"}
            </Heading>

            <FormControl isRequired>
              <Input
                placeholder="Your display name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </FormControl>

            {role === "store_owner" && (
              <FormControl isRequired>
                <Input
                  placeholder="Your shop name"
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                />
              </FormControl>
            )}

            {error && (
              <Text color="red.500" fontSize="sm">
                {error}
              </Text>
            )}

            <Button
              type="submit"
              colorScheme="blue"
              w="100%"
              isLoading={loading}
            >
              Let&apos;s Go!
            </Button>

            <Button variant="ghost" colorScheme="red" size="sm" onClick={handleSignOut}>
              Sign Out
            </Button>
          </VStack>
        </form>
      </Box>
    </Container>
  );
}