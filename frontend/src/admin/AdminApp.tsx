import { useState, lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./auth/AuthContext";
import { AdminThemeProvider } from "./layout/AdminThemeContext";
import { ProtectedRoute } from "./auth/ProtectedRoute";
import { AdminLayout } from "./layout/AdminLayout";
import { ForgotPasswordPage, LoginPage, ResetPasswordPage } from "./pages/AuthPages";
import "./admin.css";

const DashboardPage = lazy(() => import("./pages/DashboardPage").then(m => ({ default: m.DashboardPage })));
const BlogListPage = lazy(() => import("./pages/blog/BlogListPage").then(m => ({ default: m.BlogListPage })));
const BlogEditorPage = lazy(() => import("./pages/blog/BlogEditorPage").then(m => ({ default: m.BlogEditorPage })));
const BlogCategoriesPage = lazy(() => import("./pages/blog/BlogCategoriesPage").then(m => ({ default: m.BlogCategoriesPage })));
const BlogTagsPage = lazy(() => import("./pages/blog/BlogTagsPage").then(m => ({ default: m.BlogTagsPage })));
const BookListPage = lazy(() => import("./pages/books/BookListPage").then(m => ({ default: m.BookListPage })));
const BookEditorPage = lazy(() => import("./pages/books/BookEditorPage").then(m => ({ default: m.BookEditorPage })));
const BookInventoryPage = lazy(() => import("./pages/books/BookInventoryPage").then(m => ({ default: m.BookInventoryPage })));
const BookCategoriesPage = lazy(() => import("./pages/books/BookCategoriesPage").then(m => ({ default: m.BookCategoriesPage })));
const OrdersListPage = lazy(() => import("./pages/orders/OrdersListPage").then(m => ({ default: m.OrdersListPage })));
const OrderDetailPage = lazy(() => import("./pages/orders/OrderDetailPage").then(m => ({ default: m.OrderDetailPage })));
const CustomersListPage = lazy(() => import("./pages/customers/CustomersListPage").then(m => ({ default: m.CustomersListPage })));
const CustomerDetailPage = lazy(() => import("./pages/customers/CustomerDetailPage").then(m => ({ default: m.CustomerDetailPage })));
const PaymentsPage = lazy(() => import("./pages/payments/PaymentsPage").then(m => ({ default: m.PaymentsPage })));
const CouponsPage = lazy(() => import("./pages/coupons/CouponsPage").then(m => ({ default: m.CouponsPage })));
const AuthorsPage = lazy(() => import("./pages/authors/AuthorsPage").then(m => ({ default: m.AuthorsPage })));
const MediaLibraryPage = lazy(() => import("./pages/media/MediaLibraryPage").then(m => ({ default: m.MediaLibraryPage })));
const SeoSettingsPage = lazy(() => import("./pages/seo/SeoSettingsPage").then(m => ({ default: m.SeoSettingsPage })));
const SettingsPage = lazy(() => import("./pages/settings/SettingsPage").then(m => ({ default: m.SettingsPage })));
const UsersPage = lazy(() => import("./pages/users/UsersPage").then(m => ({ default: m.UsersPage })));

const AdminLoader = () => (
  <div className="flex h-64 items-center justify-center text-xs tracking-wider uppercase text-zinc-500">
    Loading Admin…
  </div>
);

export default function AdminApp() {
  const [client] = useState(
    () => new QueryClient({ defaultOptions: { queries: { refetchOnWindowFocus: false, staleTime: 15_000 } } })
  );

  return (
    <QueryClientProvider client={client}>
      <AuthProvider>
        <AdminThemeProvider>
          <Suspense fallback={<AdminLoader />}>
          <Routes>
            <Route path="login" element={<LoginPage />} />
            <Route path="forgot-password" element={<ForgotPasswordPage />} />
            <Route path="reset-password" element={<ResetPasswordPage />} />

            <Route element={<ProtectedRoute />}>
              <Route element={<AdminLayout />}>
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<DashboardPage />} />

                {/* Blog CMS */}
                <Route path="blog" element={<BlogListPage />} />
                <Route path="blog/new" element={<BlogEditorPage />} />
                <Route path="blog/categories" element={<BlogCategoriesPage />} />
                <Route path="blog/tags" element={<BlogTagsPage />} />
                <Route path="blog/:id" element={<BlogEditorPage />} />

                {/* Books Store CMS */}
                <Route path="books" element={<BookListPage />} />
                <Route path="books/new" element={<BookEditorPage />} />
                <Route path="books/inventory" element={<BookInventoryPage />} />
                <Route path="books/categories" element={<BookCategoriesPage />} />
                <Route path="books/:id" element={<BookEditorPage />} />

                {/* Orders */}
                <Route path="orders" element={<OrdersListPage />} />
                <Route path="orders/:id" element={<OrderDetailPage />} />

                {/* Customers */}
                <Route path="customers" element={<CustomersListPage />} />
                <Route path="customers/:id" element={<CustomerDetailPage />} />

                {/* Payments & Coupons */}
                <Route path="payments" element={<PaymentsPage />} />
                <Route path="coupons" element={<CouponsPage />} />

                {/* Authors */}
                <Route path="authors" element={<AuthorsPage />} />

                {/* Media Library */}
                <Route path="media" element={<MediaLibraryPage />} />

                {/* SEO & Settings */}
                <Route path="seo" element={<SeoSettingsPage />} />
                <Route path="settings" element={<SettingsPage />} />

                {/* Users */}
                <Route path="users" element={<UsersPage />} />

                <Route path="*" element={<Navigate to="dashboard" replace />} />
              </Route>
            </Route>
          </Routes>
        </Suspense>
      </AdminThemeProvider>
    </AuthProvider>
    </QueryClientProvider>
  );
}
