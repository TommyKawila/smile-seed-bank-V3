import { notFound } from "next/navigation";
import { DevLoginClient } from "./dev-login-client";

export default function DevLoginPage() {
  if (process.env.NODE_ENV !== "development") {
    notFound();
  }
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-900 px-4 text-zinc-100">
      <DevLoginClient />
    </div>
  );
}
