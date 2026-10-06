import { Outlet } from "react-router-dom";
import SiteNav from "../components/landing/SiteNav";
import SiteFooter from "../components/landing/SiteFooter";

function MainLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-void text-vellum">
      <SiteNav />
      <main className="mx-auto w-full max-w-[1240px] flex-1 px-[clamp(20px,5vw,64px)] py-12">
        <Outlet />
      </main>
      <SiteFooter />
    </div>
  );
}

export default MainLayout;
