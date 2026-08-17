import { Box, Button, Flex, Tab, TabList, Tabs, Text, VStack } from "@chakra-ui/react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const navItems = [
  { path: "/admin", label: "📋 Reports" },
  { path: "/admin/stores", label: "🏪 Stores" },
  { path: "/admin/bags", label: "🛍️ Bags" },
];

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut } = useAuth();

  const tabIndex = navItems.findIndex((item) => item.path === location.pathname);

  const handleSignOut = async () => {
    await signOut();
    navigate("/login", { replace: true });
  };

  return (
    <VStack align="stretch" minH="100vh" spacing={0}>
      {/* Top bar with flag */}
      <Box bg="palestine.black" color="white" px={6} py={3}>
        <Flex justify="space-between" align="center">
          <Flex align="center" gap={3}>
            <Text fontWeight="bold" fontSize="xl" color="palestine.red">⚙️ Qoffa Admin</Text>
            {/* Flag bar */}
            <Flex h="6px" w="60px" borderRadius="full" overflow="hidden">
              <Box flex={1} bg="#E4312B" /><Box flex={1} bg="#1C1C1C" /><Box flex={1} bg="#FFFFFF" /><Box flex={1} bg="#149954" />
            </Flex>
          </Flex>
          <Button variant="ghost" color="red.300" size="sm" onClick={handleSignOut}>
            Sign Out
          </Button>
        </Flex>
      </Box>

      {/* Horizontal tabs */}
      <Tabs index={tabIndex >= 0 ? tabIndex : 0} bg="white" borderBottom="1px solid" borderColor="gray.200">
        <TabList px={6}>
          {navItems.map((item) => (
            <Tab
              key={item.path}
              fontWeight="bold"
              _selected={{ color: "palestine.red", borderColor: "palestine.red" }}
              onClick={() => navigate(item.path)}
            >
              {item.label}
            </Tab>
          ))}
        </TabList>
      </Tabs>

      {/* Content */}
      <Box flex={1} p={6} bg="#fafafa">
        <Outlet />
      </Box>
    </VStack>
  );
}