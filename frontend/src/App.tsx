import { useState } from "react";
import { Route, Routes, Navigate } from "react-router-dom";
import AuthGuard from "./components/AuthGuard";
import LoginScreen from "./pages/Login/LoginScreen";
import SignupScreen from "./pages/Signup/SignupScreen";
import RoleSelectScreen from "./pages/Onboarding/RoleSelectScreen";
import NameEntryScreen from "./pages/Onboarding/NameEntryScreen";
import CitizenHomeScreen from "./pages/Citizen/CitizenHomeScreen";
import StoreHomeScreen from "./pages/Store/StoreHomeScreen";
import ScanStoreScreen from "./pages/Scan/ScanStoreScreen";
import ScanResultScreen from "./pages/Scan/ScanResultScreen";
import ReportLitterScreen from "./pages/Report/ReportLitterScreen";
import ReportConfirmScreen from "./pages/Report/ReportConfirmScreen";
import ReportSubmittedScreen from "./pages/Report/ReportSubmittedScreen";
import ReportDetailScreen from "./pages/Reports/ReportDetailScreen";
import AdminReviewScreen from "./pages/Admin/AdminReviewScreen";
import AdminStoresScreen from "./pages/Admin/AdminStoresScreen";
import AdminBagsScreen from "./pages/Admin/AdminBagsScreen";
import AdminLayout from "./components/AdminLayout";
import PointsHistoryScreen from "./pages/Points/PointsHistoryScreen";
import LeaderboardScreen from "./pages/Leaderboard/LeaderboardScreen";
import MapScreen from "./pages/Map/MapScreen";
import ContributePhotoScreen from "./pages/Map/ContributePhotoScreen";
import CloseReportScreen from "./pages/Map/CloseReportScreen";
import { useAuth } from "./hooks/useAuth";
import { useProfile } from "./hooks/useProfile";
import { Spinner, Center } from "@chakra-ui/react";

function AuthScreen() {
  const [isLogin, setIsLogin] = useState(true);

  if (isLogin) {
    return <LoginScreen onToggle={() => setIsLogin(false)} />;
  }
  return <SignupScreen onToggle={() => setIsLogin(true)} />;
}

/** Checks profile role and redirects to the right home or onboarding. */
function RootRedirect() {
  const { profile, loading } = useProfile();

  if (loading) {
    return (
      <Center h="100vh">
        <Spinner size="xl" />
      </Center>
    );
  }

  if (!profile || !profile.role) {
    return <Navigate to="/onboarding/role" replace />;
  }

  if (profile.role === "citizen") {
    return <Navigate to="/citizen" replace />;
  }

  if (profile.role === "admin") {
    return <Navigate to="/admin" replace />;
  }

  return <Navigate to="/store" replace />;
}

/** Wraps a child route in AuthGuard. */
function Guarded({ children }: { children: React.ReactNode }) {
  return <AuthGuard>{children}</AuthGuard>;
}

export default function App() {
  const { user } = useAuth();

  return (
    <Routes>
      {/* Public — login / signup */}
      <Route
        path="/login"
        element={user ? <RootRedirect /> : <AuthScreen />}
      />

      {/* Onboarding (requires auth) */}
      <Route
        path="/onboarding/role"
        element={
          <Guarded>
            <RoleSelectScreen onSelect={() => {}} />
          </Guarded>
        }
      />
      <Route
        path="/onboarding/name"
        element={
          <Guarded>
            <NameEntryScreen />
          </Guarded>
        }
      />

      {/* Home screens (requires auth) */}
      <Route
        path="/citizen"
        element={
          <Guarded>
            <CitizenHomeScreen />
          </Guarded>
        }
      />
      <Route
        path="/store"
        element={
          <Guarded>
            <StoreHomeScreen />
          </Guarded>
        }
      />

      {/* Scan flow (requires auth) */}
      <Route
        path="/scan"
        element={
          <Guarded>
            <ScanStoreScreen />
          </Guarded>
        }
      />
      <Route
        path="/scan/result"
        element={
          <Guarded>
            <ScanResultScreen />
          </Guarded>
        }
      />

      {/* Report flow (requires auth) */}
      <Route
        path="/report"
        element={
          <Guarded>
            <ReportLitterScreen />
          </Guarded>
        }
      />
      <Route
        path="/report/confirm"
        element={
          <Guarded>
            <ReportConfirmScreen />
          </Guarded>
        }
      />
      <Route
        path="/report/submitted"
        element={
          <Guarded>
            <ReportSubmittedScreen />
          </Guarded>
        }
      />

      {/* Map */}
      <Route
        path="/map"
        element={
          <Guarded>
            <MapScreen />
          </Guarded>
        }
      />
      <Route
        path="/reports/contribute"
        element={
          <Guarded>
            <ContributePhotoScreen />
          </Guarded>
        }
      />
      <Route
        path="/reports/close"
        element={
          <Guarded>
            <CloseReportScreen />
          </Guarded>
        }
      />
      <Route
        path="/reports/:id"
        element={
          <Guarded>
            <ReportDetailScreen />
          </Guarded>
        }
      />

      {/* Points & Leaderboard */}
      <Route
        path="/points/history"
        element={
          <Guarded>
            <PointsHistoryScreen />
          </Guarded>
        }
      />
      <Route
        path="/leaderboard"
        element={
          <Guarded>
            <LeaderboardScreen />
          </Guarded>
        }
      />

      {/* Admin — nested layout */}
      <Route
        path="/admin"
        element={
          <Guarded>
            <AdminLayout />
          </Guarded>
        }
      >
        <Route index element={<AdminReviewScreen />} />
        <Route path="stores" element={<AdminStoresScreen />} />
        <Route path="bags" element={<AdminBagsScreen />} />
      </Route>

      {/* Root — redirect based on profile role */}
      <Route
        path="/"
        element={
          <Guarded>
            <RootRedirect />
          </Guarded>
        }
      />

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}