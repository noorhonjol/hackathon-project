import { useCallback, useEffect, useState } from "react";
import { Box, Button, Text, VStack } from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { supabase } from "../../services/supabase";
import { apiFetch } from "../../services/api";
import type { ProfileResponse } from "../../types/api";
import HomeScreen from "../../components/HomeScreen";

interface AvailableBag {
  id: string;
  qr_code: string;
  store_name: string | null;
}

export default function CitizenHomeScreen() {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [availableBags, setAvailableBags] = useState<AvailableBag[]>([]);
  const [loadingBags, setLoadingBags] = useState(true);

  const fetchProfile = useCallback(async () => {
    const token = (await supabase.auth.getSession()).data.session?.access_token;
    if (token) {
      try { setProfile(await apiFetch<ProfileResponse>("/profile/me", token)); } catch {}
    }
  }, []);

  const fetchAvailableBags = useCallback(async () => {
    const token = (await supabase.auth.getSession()).data.session?.access_token;
    if (!token) return;
    try {
      const bags = await apiFetch<AvailableBag[]>("/bags/available", token);
      setAvailableBags(bags);
    } catch {}
    setLoadingBags(false);
  }, []);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);
  useEffect(() => { fetchAvailableBags(); }, [fetchAvailableBags]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/login", { replace: true });
  };

  const handleScanBag = async (qrCode: string) => {
    const token = (await supabase.auth.getSession()).data.session?.access_token;
    if (!token) return;
    try {
      const result = await apiFetch<any>("/bags/scan", token, {
        method: "POST",
        body: JSON.stringify({ qr_code: qrCode }),
      });
      navigate("/scan/result", { state: { result } });
    } catch (err) {
      navigate("/scan/result", { state: { error: (err as Error).message } });
    }
  };

  if (!profile) return null;

  return (
    <HomeScreen
      role="citizen"
      displayName={profile.display_name}
      pointsTotal={profile.points_total}
      onSignOut={handleSignOut}
    >
      <VStack spacing={3} align="stretch">
        {/* Available bags at stores */}
        {!loadingBags && availableBags.length > 0 && (
          <Box p={4} borderWidth="1px" borderRadius="lg" bg="green.50">
            <Text fontWeight="bold" mb={2}>🛍️ Available Bags</Text>
            {availableBags.map((bag) => (
              <Button
                key={bag.id}
                w="100%"
                size="sm"
                mb={1}
                colorScheme="green"
                variant="outline"
                onClick={() => handleScanBag(bag.qr_code)}
              >
                📷 Scan at {bag.store_name ?? "Store"}
              </Button>
            ))}
          </Box>
        )}

        <Button colorScheme="green" size="lg" onClick={() => navigate("/scan")}>
          📷 Scan Bag
        </Button>
        <Button colorScheme="orange" size="lg" onClick={() => navigate("/report")}>
          🗑️ Report Litter
        </Button>
      </VStack>
    </HomeScreen>
  );
}