import Link from "next/link";

export default function NotFound() {
  return (
    <section className="page narrow">
      <h1>Page not found</h1>
      <p className="lede">That capper or page doesn't exist.</p>
      <Link href="/" className="button">Back to picks</Link>
    </section>
  );
}
