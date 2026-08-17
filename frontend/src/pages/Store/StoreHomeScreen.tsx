import { useCallback, useEffect, useRef, useState } from "react";
import { Box, Button, Container, FormControl, Heading, Input, Spinner, Text, VStack } from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { QRCodeCanvas } from "qrcode.react";
import { useAuth } from "../../hooks/useAuth";
import { supabase } from "../../services/supabase";
import { apiFetch } from "../../services/api";
import type { StoreResponse } from "../../types/api";
import HomeScreen from "../../components/HomeScreen";
import StoreBagsStatus from "../../components/StoreBagsStatus";
import StoreLeaderboardSnippet from "../../components/StoreLeaderboardSnippet";

export default function StoreHomeScreen() {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [store, setStore] = useState<StoreResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [registering, setRegistering] = useState(false);
  const [error, setError] = useState("");
  const qrRef = useRef<HTMLDivElement>(null);

  const fetchStore = useCallback(async () => {
    const token = (await supabase.auth.getSession()).data.session?.access_token;
    if (!token) return;
    try { setStore(await apiFetch<StoreResponse>("/stores/me", token)); }
    catch { setStore(null); }
    setLoading(false);
  }, []);

  useEffect(() => { fetchStore(); }, [fetchStore]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegistering(true);
    const token = (await supabase.auth.getSession()).data.session?.access_token;
    if (!token) return;
    try { setStore(await apiFetch<StoreResponse>("/stores", token, { method: "POST", body: JSON.stringify({ name }) })); }
    catch (err) { setError((err as Error).message); }
    setRegistering(false);
  };

  const handleDownloadQR = () => {
    const canvas = qrRef.current?.querySelector("canvas");
    if (!canvas) return;
    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
    a.download = `${store?.name ?? "store"}-qr.png`;
    a.click();
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/login", { replace: true });
  };

  if (loading) return <Container centerContent py={20}><Spinner size="xl" /></Container>;

  if (!store) {
    return (
      <Container maxW="sm" centerContent py={20}>
        <Box w="100%" p={8} borderWidth="1px" borderRadius="xl" shadow="md" bg="white">
          <form onSubmit={handleRegister}>
            <VStack spacing={4}>
              <Heading size="lg" color="palestine.red">Register Your Store</Heading>
              <Text color="gray.500" textAlign="center">Become a Qoffa partner and reward your customers!</Text>
              <FormControl isRequired>
                <Input placeholder="Store name" value={name} onChange={(e) => setName(e.target.value)} />
              </FormControl>
              {error && <Text color="red.500" fontSize="sm">{error}</Text>}
              <Button type="submit" w="100%" isLoading={registering}>Register Store</Button>
              <Button variant="ghost" colorScheme="red" size="sm" onClick={handleSignOut}>Sign Out</Button>
            </VStack>
          </form>
        </Box>
      </Container>
    );
  }

  return (
    <HomeScreen role="store_owner" displayName={store.name} pointsTotal={store.points_total} onSignOut={handleSignOut}>
      <Box p={4} borderWidth="1px" borderRadius="lg" bg="white">
        <Text><strong>Points:</strong> {store.points_total}</Text>
        <Text><strong>Bags Avoided:</strong> {store.bags_avoided_count}</Text>
      </Box>

      <StoreBagsStatus storeId={store.id} />

      <Button colorScheme="green" size="lg" onClick={() => navigate("/scan")}>
        📷 Scan Bag
      </Button>

      <Button variant="outline" onClick={() => navigate("/points/history")}>
        📊 Points History
      </Button>

      <StoreLeaderboardSnippet />
    </HomeScreen>
  );
}