import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import Home from "../pages/Home";
import Schedule from "../pages/Schedule";
import Blog from "../pages/Blog";
import BlogPost from "../pages/BlogPost";
import Books from "../pages/Books";
import BookDetail from "../pages/BookDetail";
import Checkout from "../pages/Checkout";
import OrderSuccess from "../pages/OrderSuccess";
import About from "../pages/About";
import NotFound from "../pages/NotFound";
import AccountPortal from "../pages/AccountPortal";
import { CartProvider } from "../context/CartContext";
import { CustomerAuthProvider } from "../context/CustomerAuthContext";
import { CartDrawer } from "../components/cart/CartDrawer";

// Admin is code-split so public visitors never download it.
const AdminApp = lazy(() => import("../admin/AdminApp"));

function AppRoutes() {
  return (
    <CustomerAuthProvider>
      <CartProvider>
        <CartDrawer />
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
        <Route
          path="/admin/*"
          element={
            <Suspense fallback={<div className="grid min-h-svh place-items-center bg-void text-dim">Loading…</div>}>
              <AdminApp />
            </Suspense>
          }
        />
        <Route element={<MainLayout />}>
          <Route path="/about" element={<About />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </CartProvider>
    </CustomerAuthProvider>
  );
}

export default AppRoutes;
