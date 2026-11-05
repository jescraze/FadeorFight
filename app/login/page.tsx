import Link from "next/link";
import { logIn } from "@/app/actions";
import { Notice } from "@/components/Notice";

export const metadata = { title: "Log in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; notice?: string }>;
}) {
  const { error, notice } = await searchParams;

  return (
    <section className="page narrow">
      <h1>Log in</h1>
      <Notice error={error} notice={notice} />
      <form action={logIn} className="form">
        <label>
          Email
          <input name="email" type="email" required autoComplete="email" />
        </label>
        <label>
          Password
          <input name="password" type="password" required autoComplete="current-password" />
        </label>
        <button className="button primary" type="submit">Log in</button>
      </form>
      <p className="aside">
        New here? <Link href="/signup">Create a free account</Link>
      </p>
    </section>
  );
}
