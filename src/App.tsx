import type { ReactNode } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from './components/AppShell';
import { StaffShell } from './components/StaffShell';
import { AuthProvider, useAuth } from './context/AuthContext';
import { StaffAuthProvider, useStaffAuth } from './context/StaffAuthContext';
import { ActivityPage } from './pages/ActivityPage';
import { BranchesPage } from './pages/BranchesPage';
import { EmployeesPage } from './pages/EmployeesPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { SetupPage } from './pages/SetupPage';
import { CommandCenterPage } from './pages/CommandCenterPage';
import { StaffHomePage } from './pages/StaffHomePage';
import { StaffLoginPage } from './pages/StaffLoginPage';
import { StaffOrdersPage } from './pages/StaffOrdersPage';

function Protected({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-2 bg-slate-50 px-4 text-center text-slate-700">
        <p className="font-medium">Loading WashLy…</p>
        <p className="text-xs text-slate-500">
          Siguradoha naa ang API: php82 artisan serve --port=8000
        </p>
      </div>
    );
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

function StaffProtected({ children }: { children: ReactNode }) {
  const { employee, loading } = useStaffAuth();
  if (loading) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-2 bg-slate-50 px-4 text-center text-slate-700">
        <p className="font-medium">Loading staff…</p>
      </div>
    );
  }
  if (!employee) {
    return <Navigate to="/staff/login" replace />;
  }
  return <>{children}</>;
}

export default function App() {
  return (
    <AuthProvider>
      <StaffAuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/setup" element={<SetupPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/staff/login" element={<StaffLoginPage />} />
            <Route
              element={
                <Protected>
                  <AppShell />
                </Protected>
              }
            >
              <Route index element={<CommandCenterPage />} />
              <Route path="branches" element={<BranchesPage />} />
              <Route path="employees" element={<EmployeesPage />} />
              <Route path="activity" element={<ActivityPage />} />
            </Route>
            <Route
              element={
                <StaffProtected>
                  <StaffShell />
                </StaffProtected>
              }
            >
              <Route path="staff" element={<StaffHomePage />} />
              <Route path="staff/orders" element={<StaffOrdersPage />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </StaffAuthProvider>
    </AuthProvider>
  );
}
