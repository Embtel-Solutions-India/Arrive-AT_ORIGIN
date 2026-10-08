import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import Home from "../pages/Home";
import { CartProvider } from "../context/CartContext";
import { CustomerAuthProvider } from "../context/CustomerAuthContext";
import { CurrencyProvider } from "../context/CurrencyContext";
import { CartDrawer } from "../components/cart/CartDrawer";

// Lazy-loaded routes for code splitting
const Schedule = lazy(() => import("../pages/Schedule"));
const Blog = lazy(() => import("../pages/Blog"));
const BlogPost = lazy(() => import("../pages/BlogPost"));
const Books = lazy(() => import("../pages/Books"));
const BookDetail = lazy(() => import("../pages/BookDetail"));
const Checkout = lazy(() => import("../pages/Checkout"));
const OrderSuccess = lazy(() => import("../pages/OrderSuccess"));
const About = lazy(() => import("../pages/About"));
const NotFound = lazy(() => import("../pages/NotFound"));
const AccountPortal = lazy(() => import("../pages/AccountPortal"));
const AdminApp = lazy(() => import("../admin/AdminApp"));

const PageLoader = () => (
  <div className="grid min-h-svh place-items-center bg-void text-dim font-sans text-xs tracking-wider uppercase">
    Loading…
  </div>
);

function AppRoutes() {
  return (
    <CustomerAuthProvider>
      <CurrencyProvider>
        <CartProvider>
          <CartDrawer />
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/schedule" element={<Schedule />} />
              <Route path="/account" element={<AccountPortal />} />
              <Route path="/blog" element={<Blog />} />
              <Route path="/blog/:slug" element={<BlogPost />} />
              <Route path="/books" element={<Books />} />
              <Route path="/books/:slug" element={<BookDetail />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/order-success/:orderNumber" element={<OrderSuccess />} />
              <Route path="/admin/*" element={<AdminApp />} />
              <Route element={<MainLayout />}>
                <Route path="/about" element={<About />} />
                <Route path="*" element={<NotFound />} />
              </Route>
            </Routes>
          </Suspense>
        </CartProvider>
      </CurrencyProvider>
    </CustomerAuthProvider>
  );
}

export default AppRoutes;
