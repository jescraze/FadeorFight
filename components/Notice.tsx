export function Notice({ error, notice }: { error?: string; notice?: string }) {
  if (error) return <p className="notice is-error" role="alert">{error}</p>;
  if (notice) return <p className="notice" role="status">{notice}</p>;
  return null;
}
