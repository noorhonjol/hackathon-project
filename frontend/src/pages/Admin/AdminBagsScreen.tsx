import { useCallback, useEffect, useRef, useState } from "react";
import {
  Box,
  Button,
  Container,
  Flex,
  Grid,
  Heading,
  NumberDecrementStepper,
  NumberIncrementStepper,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  Spinner,
  Text,
  VStack,
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { QRCodeCanvas } from "qrcode.react";
import { supabase } from "../../services/supabase";
import { apiFetch } from "../../services/api";

interface BagItem {
  id: string;
  qr_code: string;
  current_location: string;
  total_scans: number;
}

function DownloadableQRCard({ bag }: { bag: BagItem }) {
  const canvasRef = useRef<HTMLDivElement>(null);

  const handleDownload = () => {
    const canvas = canvasRef.current?.querySelector("canvas");
    if (!canvas) return;
    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
    a.download = `qoffa-bag-${bag.qr_code.slice(0, 8)}.png`;
    a.click();
  };

  return (
    <Box p={4} borderWidth="1px" borderRadius="lg" textAlign="center" bg="white">
      <div ref={canvasRef}>
        <QRCodeCanvas value={bag.qr_code} size={120} level="M" />
      </div>
      <Text fontSize="xs" color="gray.500" mt={2} wordBreak="break-all">
        {bag.qr_code.slice(0, 16)}...
      </Text>
      <Text fontSize="xs" color={bag.current_location === "store" ? "green.600" : bag.current_location === "user" ? "orange.600" : "gray.500"}>
        📍 {bag.current_location}
      </Text>
      <Text fontSize="xs" color="gray.400">Scans: {bag.total_scans}</Text>
      <Button size="xs" mt={2} w="100%" onClick={handleDownload}>
        ⬇️ Download QR
      </Button>
    </Box>
  );
}

export default function AdminBagsScreen() {
  const navigate = useNavigate();
  const [bags, setBags] = useState<BagItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [batchCount, setBatchCount] = useState(5);
  const printRef = useRef<HTMLDivElement>(null);

  const getToken = useCallback(async () => {
    return (await supabase.auth.getSession()).data.session?.access_token;
  }, []);

  const fetchBags = useCallback(async () => {
    const token = await getToken();
    if (!token) return;
    try {
      setBags(await apiFetch<BagItem[]>("/bags", token));
    } catch {}
    setLoading(false);
  }, [getToken]);

  useEffect(() => { fetchBags(); }, [fetchBags]);

  const handleCreateBatch = async () => {
    setCreating(true);
    const token = await getToken();
    if (!token) return;
    try {
      const newBags = await apiFetch<BagItem[]>(
        `/bags/create-batch?count=${batchCount}`,
        token,
        { method: "POST" },
      );
      setBags((prev) => [...newBags, ...prev]);
    } catch {}
    setCreating(false);
  };

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`
      <html><head><title>Qoffa Bag QR Codes</title>
      <style>
        body { font-family: Arial; padding: 20px; }
        .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
        .card { text-align: center; border: 1px solid #ddd; border-radius: 8px; padding: 15px; page-break-inside: avoid; }
        .code { font-size: 10px; color: #666; word-break: break-all; margin-top: 5px; }
      </style></head><body>
      <h1>Qoffa Reusable Bag QR Codes</h1>
      <div class="grid">
    `);
    bags.forEach((b) => {
      printWindow.document.write(`
        <div class="card">
          <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${b.qr_code}" />
          <div class="code">${b.qr_code}</div>
        </div>
      `);
    });
    printWindow.document.write("</div></body></html>");
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <Container maxW="container.lg" py={10}>
      <VStack spacing={6} align="stretch" w="100%">
        <Flex justify="space-between" align="center">
          <Heading size="2xl">🛍️ Reusable Bags</Heading>
        </Flex>

        {/* Create batch */}
        <Flex gap={3} align="center" p={4} borderWidth="1px" borderRadius="lg" bg="white">
          <Text fontWeight="bold">Create bags:</Text>
          <NumberInput
            value={batchCount}
            onChange={(_, v) => setBatchCount(v)}
            min={1}
            max={100}
            w="100px"
          >
            <NumberInputField />
            <NumberInputStepper>
              <NumberIncrementStepper />
              <NumberDecrementStepper />
            </NumberInputStepper>
          </NumberInput>
          <Button isLoading={creating} onClick={handleCreateBatch}>
            Generate
          </Button>
          <Button variant="outline" onClick={handlePrint} isDisabled={bags.length === 0}>
            🖨️ Print All QR
          </Button>
        </Flex>

        {loading ? (
          <Spinner />
        ) : bags.length === 0 ? (
          <Box p={8} textAlign="center" borderWidth="1px" borderRadius="lg" bg="white">
            <Text color="gray.500">No bags created yet. Use the form above to generate them.</Text>
          </Box>
        ) : (
          <Box ref={printRef}>
            <Flex justify="space-between" mb={2}>
              <Text fontSize="sm" color="gray.500">{bags.length} bags total</Text>
            </Flex>
            <Grid templateColumns="repeat(auto-fill, minmax(180px, 1fr))" gap={4}>
              {bags.map((b) => (
                <DownloadableQRCard key={b.id} bag={b} />
              ))}
            </Grid>
          </Box>
        )}
      </VStack>
    </Container>
  );
}