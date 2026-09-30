import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import Home from "../pages/Home";
import Schedule from "../pages/Schedule";
import Blog from "../pages/Blog";
import BlogPost from "../pages/BlogPost";
import About from "../pages/About";
import NotFound from "../pages/NotFound";

// Admin is code-split so public visitors never download it.
const AdminApp = lazy(() => import("../admin/AdminApp"));

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/schedule" element={<Schedule />} />
      <Route path="/blog" element={<Blog />} />
      <Route path="/blog/:slug" element={<BlogPost />} />
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
  );
}

export default AppRoutes;
