// Declarative schema for the category-specific fields listing-form.tsx
// renders in its step 1 "Item details" section (Condition, Colour, Key
// Features, etc. — vehicles additionally gets the hand-built cascading
// fields in vehicle-spec-fields.tsx for make/model/year/trim, which the form
// filters out of this list via VEHICLE_CASCADE_KEYS). Adding a field here is
// enough to get it rendered, validated (via `required`), and stored in the
// listing's `attributes` JSON column — no form changes needed per category.
export type ListingFieldType = "text" | "number" | "select" | "boolean" | "tags";

export type ListingFieldDef = {
  key: string;
  label: string;
  type: ListingFieldType;
  options?: string[];
  required?: boolean;
};

/** Shared across every category that gets the universal fields — a house's exterior
 * colour and a phone's colour are the same comparison axis, so one curated list. */
export const COLOR_OPTIONS = [
  "Black",
  "White",
  "Silver",
  "Gray",
  "Red",
  "Blue",
  "Green",
  "Yellow",
  "Brown",
  "Beige",
  "Gold",
  "Orange",
  "Purple",
  "Maroon",
  "Multicolor",
];

const CONDITION_3_TIER = ["New", "Foreign Used", "Locally Used"];

// Vehicle list is lifted directly from the Jiji reference screenshot. The others are
// reasonable defaults, not reference-confirmed — worth a sanity check/edit.
const KEY_FEATURE_OPTIONS: Record<string, string[]> = {
  vehicles: [
    "Air Conditioning",
    "Alloy Wheels",
    "AM/FM Radio",
    "Electric Windows",
    "Airbags",
    "ABS Brakes",
    "Bluetooth",
    "Reverse Camera",
    "Sunroof",
    "Leather Seats",
    "Navigation System",
    "Cruise Control",
    "Keyless Entry",
    "Power Steering",
    "Heated Seats",
  ],
  "phones-tablets": [
    "Face ID / Fingerprint Scanner",
    "Fast Charging",
    "Wireless Charging",
    "Dual SIM",
    "5G",
    "Water Resistant",
    "NFC",
  ],
  electronics: ["Warranty Included", "Smart / WiFi Enabled", "Bluetooth", "Voice Control", "Energy Efficient"],
  "home-furniture-appliances": [
    "Assembly Required",
    "Extendable",
    "Water Resistant",
    "Energy Efficient",
    "Storage Included",
  ],
  property: [
    "Gated Community",
    "Swimming Pool",
    "CCTV Security",
    "Borehole / Water Supply",
    "Boys Quarters",
    "Air Conditioning",
    "Parking Space",
    "Fitted Kitchen",
  ],
};

/** Dynamic fields shown in the post-ad flow, keyed by top-level category slug.
 * Condition/Colour/Key Features/Exchange Possible are added to whichever categories
 * they make sense for (property skips Condition/Colour — see below). */
export const CATEGORY_FIELDS: Record<string, ListingFieldDef[]> = {
  vehicles: [
    { key: "make", label: "Make", type: "text", required: true },
    { key: "model", label: "Model", type: "text", required: true },
    { key: "year", label: "Year of Manufacture", type: "number", required: true },
    { key: "trim", label: "Trim", type: "text" },
    { key: "condition", label: "Condition", type: "select", options: CONDITION_3_TIER, required: true },
    { key: "color", label: "Colour", type: "select", options: COLOR_OPTIONS, required: true },
    { key: "interior_color", label: "Interior Color", type: "text" },
    { key: "body_type", label: "Body Type", type: "select", options: [
      "Sedan", "SUV", "Hatchback", "Coupe", "Convertible", "Wagon", "Station Wagon", "Pickup", "Van", "Minivan", "Truck", "Bus",
    ] },
    { key: "engine_size", label: "Engine Size", type: "select", options: [
      "1000cc", "1200cc", "1300cc", "1400cc", "1500cc", "1600cc", "1800cc", "2000cc", "2200cc", "2400cc", "2500cc", "3000cc", "3500cc", "4000cc", "4000cc+",
    ] },
    { key: "powertrain_type", label: "Powertrain Type", type: "select", options: ["Internal Combustion", "Hybrid", "Electric"] },
    { key: "fuel_type", label: "Fuel", type: "select", options: ["Petrol", "Diesel", "Electric", "Hybrid", "Mild Hybrid", "Plug-in Hybrid"] },
    {
      key: "transmission",
      label: "Transmission",
      type: "select",
      options: ["Automatic", "Manual"],
      required: true,
    },
    { key: "mileage", label: "Mileage (km)", type: "number" },
    { key: "vin", label: "VIN / Chassis number", type: "text" },
    { key: "registered", label: "Registered Car", type: "boolean" },
    { key: "key_features", label: "Key Features", type: "tags", options: KEY_FEATURE_OPTIONS.vehicles },
    { key: "exchange_possible", label: "Exchange Possible", type: "boolean" },
  ],
  property: [
    {
      key: "property_type",
      label: "Property Type",
      type: "select",
      options: ["House", "Apartment", "Land", "Commercial"],
      required: true,
    },
    { key: "bedrooms", label: "Bedrooms", type: "number" },
    { key: "bathrooms", label: "Bathrooms", type: "number" },
    {
      key: "furnished",
      label: "Furnished",
      type: "select",
      options: ["Yes", "No", "Partly"],
    },
    // No Condition/Colour here on purpose — "New/Used" and a paint-swatch list don't
    // fit real estate the way they fit consumer goods.
    { key: "key_features", label: "Key Features", type: "tags", options: KEY_FEATURE_OPTIONS.property },
    { key: "exchange_possible", label: "Exchange Possible", type: "boolean" },
  ],
  "phones-tablets": [
    { key: "brand", label: "Brand", type: "text", required: true },
    { key: "storage", label: "Storage", type: "text" },
    {
      key: "condition",
      label: "Condition",
      type: "select",
      options: CONDITION_3_TIER,
      required: true,
    },
    { key: "color", label: "Colour", type: "select", options: COLOR_OPTIONS },
    { key: "key_features", label: "Key Features", type: "tags", options: KEY_FEATURE_OPTIONS["phones-tablets"] },
    { key: "exchange_possible", label: "Exchange Possible", type: "boolean" },
  ],
  electronics: [
    { key: "brand", label: "Brand", type: "text" },
    {
      key: "condition",
      label: "Condition",
      type: "select",
      options: CONDITION_3_TIER,
      required: true,
    },
    { key: "color", label: "Colour", type: "select", options: COLOR_OPTIONS },
    { key: "key_features", label: "Key Features", type: "tags", options: KEY_FEATURE_OPTIONS.electronics },
    { key: "exchange_possible", label: "Exchange Possible", type: "boolean" },
  ],
  "home-furniture-appliances": [
    { key: "material", label: "Material", type: "text" },
    {
      key: "condition",
      label: "Condition",
      type: "select",
      options: ["New", "Used"],
      required: true,
    },
    { key: "color", label: "Colour", type: "select", options: COLOR_OPTIONS },
    { key: "key_features", label: "Key Features", type: "tags", options: KEY_FEATURE_OPTIONS["home-furniture-appliances"] },
    { key: "exchange_possible", label: "Exchange Possible", type: "boolean" },
  ],
};

/** Vehicles has 9 leaf subcategories (Cars, Motorcycles, Trucks, ...) but CATEGORY_FIELDS
 * only has one shared "vehicles" field set -- Cars gets a real Type dimension via
 * body_type, but the other leaves (a boat, a bicycle, a repair service) have no
 * equivalent attribute at all. This adds a single leaf-specific "Type" field for those,
 * spliced into the shared vehicles fields by getFieldsForCategory below. Options are
 * sourced from Tonaton's category structure (the closest Ghanaian reference site). */
const LEAF_TYPE_FIELD: Record<string, { label: string; options: string[] }> = {
  "motorcycles-scooters": {
    label: "Type",
    options: ["Cruiser", "Dual Sport", "Motocross", "Quad (ATV)", "Scooter", "Sport Bike", "Standard"],
  },
  "trucks-trailers": {
    label: "Type",
    options: ["Mini Truck", "Dump Truck", "Food Truck", "Trailer", "Heavy-Duty Truck"],
  },
  "construction-heavy-machinery": {
    label: "Type",
    options: ["Excavator", "Wheel Loader", "Forklift", "Tractor", "Grader", "Backhoe Loader", "Bulldozer"],
  },
  "watercraft-boats": {
    label: "Type",
    options: ["Bow Rider Boat", "Banana Boat", "Barge & Pontoon", "Bass Boat", "Cabin Cruiser Boat", "Canoe"],
  },
  "personal-mobility": {
    label: "Type",
    options: ["Bicycle", "Electric Bicycle", "Hoverboard", "Electric Scooter", "Accessories"],
  },
  "vehicle-parts-accessories": {
    label: "Type",
    options: [
      "Exterior Accessories",
      "Engine & Drivetrain",
      "Headlights & Lighting",
      "Brakes, Suspension & Steering",
      "Wheels & Parts",
      "Interior Accessories",
      "Audio Parts",
    ],
  },
  "vehicle-car-services": {
    label: "Type of Services",
    options: ["Tuning Services", "Detailing Services", "Car Repair", "Other"],
  },
};

export function getFieldsForCategory(
  topLevelSlug: string | undefined,
  leafSlug?: string
): ListingFieldDef[] {
  if (!topLevelSlug) return [];
  const fields = CATEGORY_FIELDS[topLevelSlug] ?? [];
  const leafType = leafSlug && LEAF_TYPE_FIELD[leafSlug];
  if (!leafType) return fields;

  // Inserted right after Trim (the last of the make/model/year/trim cascade) so it
  // reads as part of "what this vehicle is" rather than getting buried lower down.
  const trimIndex = fields.findIndex((f) => f.key === "trim");
  const typeField: ListingFieldDef = {
    key: "vehicle_type",
    label: leafType.label,
    type: "select",
    options: leafType.options,
    required: true,
  };
  const insertAt = trimIndex === -1 ? fields.length : trimIndex + 1;
  return [...fields.slice(0, insertAt), typeField, ...fields.slice(insertAt)];
}

/** The 1-2 most important attributes per category, surfaced as icon badges above the spec table. */
export const HEADLINE_FIELD_KEYS: Record<string, string[]> = {
  vehicles: ["condition", "transmission"],
  property: ["property_type", "furnished"],
  "phones-tablets": ["condition", "storage"],
  electronics: ["condition", "brand"],
  "home-furniture-appliances": ["condition", "material"],
};
