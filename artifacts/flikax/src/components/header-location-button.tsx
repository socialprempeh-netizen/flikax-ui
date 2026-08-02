"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MapPin } from "lucide-react";
import { LocationPickerModal } from "@/components/location-picker-modal";

/** Sticky top-bar location control -- icon only, deliberately no "Ghana"
 * (or any place name) text next to it, unlike the hero search bar's own
 * "All Ghana" location field. Picking a location here browses the
 * homepage filtered to it. */
export function HeaderLocationButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title="Choose location"
        aria-label="Choose location"
        className="flex size-9 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 sm:size-10"
      >
        <MapPin className="size-4 sm:size-5" />
      </button>

      <LocationPickerModal
        open={open}
        onClose={() => setOpen(false)}
        onSelect={(name) => router.push(name ? `/?location=${encodeURIComponent(name)}` : "/")}
      />
    </>
  );
}
