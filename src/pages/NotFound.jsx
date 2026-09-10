import { Link } from "react-router-dom";

function NotFound() {
  return (
    <section className="max-w-3xl">
      <h1 className="mb-6 text-5xl font-light leading-tight">404 — Page Not Found</h1>
      <Link to="/" className="text-[#E8CE8C] underline">Back to home</Link>
    </section>
  );
}

export default NotFound;
