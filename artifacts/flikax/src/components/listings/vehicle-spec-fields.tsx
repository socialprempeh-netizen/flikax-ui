"use client";

import { useState } from "react";
import { CAR_MAKES_MODELS } from "@/lib/car-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const OTHER_VALUE = "__other__";
const MAKES = Object.keys(CAR_MAKES_MODELS).sort((a, b) => a.localeCompare(b));
const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: CURRENT_YEAR - 1980 + 2 }, (_, i) => String(CURRENT_YEAR + 1 - i));

const FIELD_CLASS =
  "h-auto w-full rounded-lg border-neutral-200 px-3 py-2 text-sm text-neutral-800 outline-none focus-visible:border-brand disabled:bg-neutral-50";

// Vehicles-only: cascading Make -> Model dropdowns sourced from the bundled
// NHTSA car-data set, with a free-text "Other / Not listed" escape hatch for
// makes/models the dataset doesn't cover. Year is a plain dropdown (not
// cascaded from make/model — see car-data.ts for why). Trim stays free-text
// since no reliable open trim dataset exists.
export function VehicleSpecFields({
  attributes,
  setAttribute,
}: {
  attributes: Record<string, string | string[]>;
  setAttribute: (key: string, value: string) => void;
}) {
  const currentMake = (attributes.make as string | undefined) ?? "";
  const currentModel = (attributes.model as string | undefined) ?? "";
  const modelsForMake =
    currentMake && CAR_MAKES_MODELS[currentMake]
      ? [...CAR_MAKES_MODELS[currentMake]].sort((a, b) => a.localeCompare(b))
      : [];

  const [makeMode, setMakeMode] = useState<"select" | "other">(
    currentMake && !MAKES.includes(currentMake) ? "other" : "select"
  );
  const [modelMode, setModelMode] = useState<"select" | "other">(
    currentModel && !modelsForMake.includes(currentModel) ? "other" : "select"
  );

  return (
    <div className="grid grid-cols-2 gap-4">
      <label className="block">
        <span className="mb-1 block text-sm font-medium text-neutral-700">Make*</span>
        {makeMode === "select" ? (
          <select
            required
            value={currentMake}
            onChange={(e) => {
              if (e.target.value === OTHER_VALUE) {
                setMakeMode("other");
                setAttribute("make", "");
              } else {
                setAttribute("make", e.target.value);
              }
              setAttribute("model", "");
              setModelMode("select");
            }}
            className={FIELD_CLASS}
          >
            <option value="" disabled>
              Select make
            </option>
            {MAKES.map((make) => (
              <option key={make} value={make}>
                {make}
              </option>
            ))}
            <option value={OTHER_VALUE}>Other / Not listed</option>
          </select>
        ) : (
          <div className="space-y-1">
            <Input
              type="text"
              required
              value={currentMake}
              onChange={(e) => setAttribute("make", e.target.value)}
              placeholder="Enter make"
              className={FIELD_CLASS}
            />
            <Button
              type="button"
              onClick={() => {
                setMakeMode("select");
                setAttribute("make", "");
                setAttribute("model", "");
                setModelMode("select");
              }}
              variant="link"
              className="h-auto p-0 text-xs"
            >
              Choose from list instead
            </Button>
          </div>
        )}
      </label>

      <label className="block">
        <span className="mb-1 block text-sm font-medium text-neutral-700">Model*</span>
        {modelMode === "select" && modelsForMake.length > 0 ? (
          <select
            required
            value={currentModel}
            disabled={!currentMake}
            onChange={(e) => {
              if (e.target.value === OTHER_VALUE) {
                setModelMode("other");
                setAttribute("model", "");
              } else {
                setAttribute("model", e.target.value);
              }
            }}
            className={FIELD_CLASS}
          >
            <option value="" disabled>
              {currentMake ? "Select model" : "Choose make first"}
            </option>
            {modelsForMake.map((model) => (
              <option key={model} value={model}>
                {model}
              </option>
            ))}
            <option value={OTHER_VALUE}>Other / Not listed</option>
          </select>
        ) : (
          <div className="space-y-1">
            <Input
              type="text"
              required
              value={currentModel}
              disabled={!currentMake}
              onChange={(e) => setAttribute("model", e.target.value)}
              placeholder="Enter model"
              className={FIELD_CLASS}
            />
            {modelsForMake.length > 0 && (
              <Button
                type="button"
                onClick={() => {
                  setModelMode("select");
                  setAttribute("model", "");
                }}
                variant="link"
                className="h-auto p-0 text-xs"
              >
                Choose from list instead
              </Button>
            )}
          </div>
        )}
      </label>

      <label className="block">
        <span className="mb-1 block text-sm font-medium text-neutral-700">Year of Manufacture*</span>
        <select
          required
          value={(attributes.year as string | undefined) ?? ""}
          onChange={(e) => setAttribute("year", e.target.value)}
          className={FIELD_CLASS}
        >
          <option value="" disabled>
            Select year
          </option>
          {YEARS.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="mb-1 block text-sm font-medium text-neutral-700">Trim (optional)</span>
        <Input
          type="text"
          value={(attributes.trim as string | undefined) ?? ""}
          onChange={(e) => setAttribute("trim", e.target.value)}
          placeholder="e.g. SE, Limited, Sport"
          className={FIELD_CLASS}
        />
      </label>
    </div>
  );
}
