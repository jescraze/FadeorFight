import Link from "next/link";
import { signUp } from "@/app/actions";
import { Notice } from "@/components/Notice";

export const metadata = { title: "Join free" };

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <section className="page narrow">
      <h1>Join free</h1>
      <p className="lede">See every main card pick, make your own picks in the community, and get prelim picks when memberships open.</p>
      <Notice error={error} />
      <form action={signUp} className="form">
        <label>
          Username
          <input
            name="username"
            required
            minLength={3}
            maxLength={20}
            pattern="[a-z0-9_]+"
            autoComplete="username"
            placeholder="lowercase, numbers, underscores"
          />
        </label>
        <label>
          Display name <span className="optional">optional</span>
          <input name="display_name" maxLength={40} />
        </label>
        <label>
          Email
          <input name="email" type="email" required autoComplete="email" />
        </label>
        <label>
          Password
          <input name="password" type="password" required minLength={8} autoComplete="new-password" />
        </label>
        <button className="button primary" type="submit">Create account</button>
      </form>
      <p className="aside">
        Already have an account? <Link href="/login">Log in</Link>
      </p>
    </section>
  );
}
