import { useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./auth/AuthContext";
import { ProtectedRoute } from "./auth/ProtectedRoute";
import { AdminLayout } from "./layout/AdminLayout";
import { ForgotPasswordPage, LoginPage, ResetPasswordPage } from "./pages/AuthPages";
import { DashboardPage } from "./pages/DashboardPage";
import { BlogListPage } from "./pages/blog/BlogListPage";
import { BlogEditorPage } from "./pages/blog/BlogEditorPage";
import { BlogCategoriesPage } from "./pages/blog/BlogCategoriesPage";
import { BlogTagsPage } from "./pages/blog/BlogTagsPage";
import { BookListPage } from "./pages/books/BookListPage";
import { BookEditorPage } from "./pages/books/BookEditorPage";
import { BookInventoryPage } from "./pages/books/BookInventoryPage";
import { BookCategoriesPage } from "./pages/books/BookCategoriesPage";
import { OrdersListPage } from "./pages/orders/OrdersListPage";
import { OrderDetailPage } from "./pages/orders/OrderDetailPage";
import { CustomersListPage } from "./pages/customers/CustomersListPage";
import { CustomerDetailPage } from "./pages/customers/CustomerDetailPage";
import { PaymentsPage } from "./pages/payments/PaymentsPage";
import { AuthorsPage } from "./pages/authors/AuthorsPage";
import { MediaLibraryPage } from "./pages/media/MediaLibraryPage";
import { SeoSettingsPage } from "./pages/seo/SeoSettingsPage";
import { SettingsPage } from "./pages/settings/SettingsPage";
import { UsersPage } from "./pages/users/UsersPage";
import "./admin.css";

export default function AdminApp() {
  const [client] = useState(
    () => new QueryClient({ defaultOptions: { queries: { refetchOnWindowFocus: false, staleTime: 15_000 } } })
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

              {/* Payments */}
              <Route path="payments" element={<PaymentsPage />} />

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
      </AuthProvider>
    </QueryClientProvider>
  );
}
