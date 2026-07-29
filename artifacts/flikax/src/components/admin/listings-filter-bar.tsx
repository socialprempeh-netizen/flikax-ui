import Link from "next/link";
import { X } from "lucide-react";
import { ADMIN_STATUS_LABELS } from "@/lib/admin-listings";
import type { AdminListingFilters } from "@/lib/admin-listing-filters";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const SELECT_CLASS =
  "h-9 rounded-md border border-input bg-transparent px-3 text-sm text-slate-800 shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50";

export function ListingsFilterBar({
  filters,
  categories,
}: {
  filters: AdminListingFilters;
  categories: { id: string; name: string }[];
}) {
  const hasFilters = Boolean(
    filters.q || filters.status || filters.category || filters.location || filters.featured || filters.bumped
  );

  return (
    <Card className="mb-4 gap-0 rounded-2xl p-4 shadow-sm">
      <form method="get" className="flex flex-wrap items-end gap-3">
        <label className="block">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Search
          </span>
          <Input type="text" name="q" defaultValue={filters.q} placeholder="Title or seller name" className="w-52" />
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Status
          </span>
          <select name="status" defaultValue={filters.status ?? ""} className={SELECT_CLASS}>
            <option value="">All</option>
            {Object.entries(ADMIN_STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
            <option value="expired">Expired</option>
          </select>
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Category
          </span>
          <select name="category" defaultValue={filters.category ?? ""} className={SELECT_CLASS}>
            <option value="">All</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Location
          </span>
          <Input type="text" name="location" defaultValue={filters.location} placeholder="e.g. Accra" className="w-36" />
        </label>

        <label className="flex items-center gap-1.5 pb-2.5 text-sm text-slate-700">
          <input
            type="checkbox"
            name="featured"
            value="1"
            defaultChecked={filters.featured === "1"}
            className="size-4 accent-brand"
          />
          Featured
        </label>

        <label className="flex items-center gap-1.5 pb-2.5 text-sm text-slate-700">
          <input
            type="checkbox"
            name="bumped"
            value="1"
            defaultChecked={filters.bumped === "1"}
            className="size-4 accent-brand"
          />
          Bumped
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Sort
          </span>
          <select name="sort" defaultValue={filters.sort ?? "newest"} className={SELECT_CLASS}>
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="price_high">Price: high to low</option>
            <option value="price_low">Price: low to high</option>
          </select>
        </label>

        <Button type="submit">Apply</Button>

        {hasFilters && (
          <Button asChild variant="ghost" className="text-slate-500 hover:text-brand">
            <Link href="/admin/listings">
              <X className="size-3.5" />
              Clear
            </Link>
          </Button>
        )}
      </form>
    </Card>
  );
}
