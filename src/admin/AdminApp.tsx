import { useState } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./auth/AuthContext";
import { ProtectedRoute } from "./auth/ProtectedRoute";
import { AdminLayout } from "./layout/AdminLayout";
import { adminNav } from "./layout/nav";
import { ForgotPasswordPage, LoginPage, ResetPasswordPage } from "./pages/AuthPages";
import { DashboardPage } from "./pages/DashboardPage";
import { PageHeader } from "./components/ui";
import "./admin.css";

function ComingSoon() {
  const { pathname } = useLocation();
  const item = adminNav.flatMap((g) => g.items).find((i) => i.to === pathname);
  return <PageHeader title={item?.label ?? "Not found"} description="This section is built in an upcoming phase." />;
}

const sections = adminNav.flatMap((g) => g.items).filter((i) => i.to !== "/admin/dashboard");

export default function AdminApp() {
  const [client] = useState(
    () => new QueryClient({ defaultOptions: { queries: { refetchOnWindowFocus: false, staleTime: 30_000 } } }),
  );

  return (
    <QueryClientProvider client={client}>
      <AuthProvider>
        <Routes>
          <Route path="login" element={<LoginPage />} />
          <Route path="forgot-password" element={<ForgotPasswordPage />} />
          <Route path="reset-password" element={<ResetPasswordPage />} />

          <Route element={<ProtectedRoute />}>
            <Route element={<AdminLayout />}>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<DashboardPage />} />
              {sections.map((s) => (
                <Route key={s.to} element={<ProtectedRoute permission={s.permission} />}>
                  <Route path={s.to.replace("/admin/", "")} element={<ComingSoon />} />
                </Route>
              ))}
              <Route path="*" element={<ComingSoon />} />
            </Route>
          </Route>
        </Routes>
      </AuthProvider>
    </QueryClientProvider>
  );
}
