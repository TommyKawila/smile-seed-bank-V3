import type { MagazineProductPublic } from "@/lib/blog-service";
import { MagazineProductStoryCard } from "./MagazineProductStoryCard";

export function ShopTheStorySection({
  products,
}: {
  products: MagazineProductPublic[];
}) {
  if (products.length === 0) return null;

  return (
    <section className="mx-auto mt-16 max-w-[720px] border-t border-zinc-200 pt-14">
      <div className="mb-8 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <h2 className="font-[family-name:var(--font-magazine-serif)] text-2xl font-semibold tracking-tight text-emerald-950">
          Shop the Story
        </h2>
        <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-zinc-500">
          Related products
        </p>
      </div>
      <ul className="grid gap-5 sm:grid-cols-2">
        {products.map((p) => (
          <li key={p.id}>
            <MagazineProductStoryCard product={p} variant="grid" />
          </li>
        ))}
      </ul>
    </section>
  );
}
