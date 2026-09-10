import { Outlet } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

function MainLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-[#070B18] text-[#EDE7DA]">
      <Navbar />
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-16">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

export default MainLayout;
