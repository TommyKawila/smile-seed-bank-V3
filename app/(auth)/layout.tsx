export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 via-white to-zinc-50">{children}</div>
  );
}
