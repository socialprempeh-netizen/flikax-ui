"use client";

import { useState } from "react";
import { Phone } from "lucide-react";
import { Button } from "@/components/ui/button";

export function RevealPhoneButton({
  phone,
  label,
  variant = "solid",
  compact = false,
}: {
  phone: string;
  label: string;
  variant?: "solid" | "outline";
  /** Content-sized and sharing a row with a sibling action (e.g. the mobile
   * Show contact/Message pair), rather than the default full-width block
   * used everywhere this stands alone in a sidebar column. */
  compact?: boolean;
}) {
  const [revealed, setRevealed] = useState(false);

  const buttonVariant = variant === "solid" ? "default" : "outline";
  // The "outline" variant here means brand-tinted-at-rest (not shadcn's
  // generic neutral outline), so its own colors are layered on top.
  const outlineClasses =
    variant === "outline" ? "border-brand/30 bg-brand-light text-brand-dark hover:bg-brand/10 hover:text-brand-dark" : "";
  const sizeClasses = compact ? "h-11 flex-1" : "h-11 w-full";

  if (revealed) {
    return (
      <Button asChild variant={buttonVariant} size={compact ? "default" : "lg"} className={`${sizeClasses} ${outlineClasses}`}>
        <a href={`tel:${phone}`}>
          <Phone className="size-4" />
          {phone}
        </a>
      </Button>
    );
  }

  return (
    <Button
      type="button"
      onClick={() => setRevealed(true)}
      variant={buttonVariant}
      size={compact ? "default" : "lg"}
      className={`${sizeClasses} ${outlineClasses}`}
    >
      <Phone className="size-4" />
      {label}
    </Button>
  );
}
