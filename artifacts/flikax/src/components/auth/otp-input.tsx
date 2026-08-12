"use client";

import { useRef } from "react";

// Six individual boxes (not one text field with letter-spacing) so the code
// reads the way a passport/bank OTP screen does -- each digit its own tap
// target, auto-advancing forward on entry and back on backspace, with paste
// and SMS-autofill (which can land the whole code in a single box at once)
// both distributing across all six.
export function OtpInput({
  value,
  onChange,
  length = 6,
  autoFocus = false,
}: {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  autoFocus?: boolean;
}) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  function setDigit(index: number, digit: string) {
    const next = value.split("");
    next[index] = digit;
    onChange(next.join("").slice(0, length));
  }

  function distributeFrom(index: number, digits: string) {
    const next = value.split("");
    digits.split("").forEach((d, i) => {
      if (index + i < length) next[index + i] = d;
    });
    onChange(next.join("").slice(0, length));
    inputRefs.current[Math.min(index + digits.length, length) - 1]?.focus();
  }

  function handleChange(index: number, raw: string) {
    const digits = raw.replace(/\D/g, "");
    if (digits.length === 0) {
      setDigit(index, "");
      return;
    }
    if (digits.length === 1) {
      setDigit(index, digits);
      if (index < length - 1) inputRefs.current[index + 1]?.focus();
      return;
    }
    // More than one digit landed in a single box -- SMS autofill or a paste
    // onPaste didn't intercept -- so spread it forward instead of keeping
    // only the last character.
    distributeFrom(index, digits);
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !value[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handlePaste(index: number, e: React.ClipboardEvent<HTMLInputElement>) {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "");
    if (!pasted) return;
    e.preventDefault();
    distributeFrom(index, pasted);
  }

  return (
    <div className="flex justify-between gap-2">
      {Array.from({ length }).map((_, i) => (
        <input
          key={i}
          ref={(el) => {
            inputRefs.current[i] = el;
          }}
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={1}
          autoFocus={autoFocus && i === 0}
          value={value[i] ?? ""}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={(e) => handlePaste(i, e)}
          onFocus={(e) => e.target.select()}
          aria-label={`Digit ${i + 1} of ${length}`}
          className="h-12 w-full min-w-0 border border-neutral-300 text-center text-lg font-semibold text-slate-950 shadow-none outline-none transition-colors focus:border-brand focus:ring-2 focus:ring-brand/15"
        />
      ))}
    </div>
  );
}
