import {
  Home,
  Building2,
  Trees,
  Building,
  Bike,
  Scooter,
  Truck,
  Caravan,
  HardHat,
  Forklift,
  Tractor,
  Ship,
  Sailboat,
  Package,
  Wrench,
  Cog,
  Settings2,
  type LucideIcon,
} from "lucide-react";
import { getFieldsForCategory } from "@/lib/listing-fields";

export type SidebarFieldType = "text" | "range" | "checklist" | "toggle";

export type SidebarFilterField = {
  key: string;
  label: string;
  type: SidebarFieldType;
  options?: string[];
  // checklist only: true when the underlying attribute stores an array (e.g. Key
  // Features) rather than a single scalar -- a listing matches if it has ANY of the
  // checked values, not an exact match, and category-listings.ts needs to know which
  // query operator that implies.
  arrayField?: boolean;
};

/** Curated, per-top-level-category subset of CATEGORY_FIELDS shown in the sidebar --
 * deliberately narrow (Location + Price are handled separately, always shown) rather
 * than dumping every attribute the listing form collects. */
const SIDEBAR_FIELD_KEYS: Record<string, string[]> = {
  vehicles: ["make", "year", "condition", "transmission", "mileage"],
  property: ["property_type", "bedrooms", "bathrooms", "furnished"],
  "phones-tablets": ["brand", "condition"],
  electronics: ["brand", "condition"],
  "home-furniture-appliances": ["material", "condition"],
};

/** Overrides SIDEBAR_FIELD_KEYS per vehicle leaf subcategory (Cars, Motorcycles, ...) --
 * Tonaton shows a different filter set per leaf (a boat has no "transmission"), whereas
 * the top-level "vehicles" set above is really just the Cars-shaped default. Keyed by
 * leaf slug rather than nested under "vehicles" since leaf slugs are unique site-wide.
 * Every key here maps to a real, already-collected listing attribute (see
 * listing-fields.ts) -- nothing invented just to pad out the filter list. */
const LEAF_SIDEBAR_FIELD_KEYS: Record<string, string[]> = {
  cars: [
    "make",
    "model",
    "body_type",
    "year",
    "condition",
    "color",
    "powertrain_type",
    "fuel_type",
    "transmission",
    "mileage",
    "registered",
    "key_features",
    "exchange_possible",
  ],
  "motorcycles-scooters": ["vehicle_type", "make", "year", "powertrain_type", "condition", "color", "exchange_possible"],
  "buses-microbuses": ["make", "transmission", "condition", "color", "fuel_type", "exchange_possible"],
  "trucks-trailers": ["vehicle_type", "make", "year", "condition", "exchange_possible"],
  "construction-heavy-machinery": ["vehicle_type", "make", "condition", "year", "exchange_possible"],
  "watercraft-boats": ["vehicle_type", "year", "condition", "exchange_possible"],
  "personal-mobility": ["vehicle_type", "color", "condition", "exchange_possible"],
  "vehicle-parts-accessories": ["vehicle_type", "make", "condition"],
  "vehicle-car-services": ["vehicle_type"],
};

/** Two filters that apply to every category, backed by real listing columns
 * (`seller_verified`/`is_discounted` -- see the migration that added them) rather than
 * a per-category attribute, so they're appended after the category-specific fields
 * instead of living in the key lists above. Rendered as a 3-state Any/Yes/No toggle,
 * same as the boolean attribute fields below. */
export const VERIFIED_SELLERS_FIELD: SidebarFilterField = {
  key: "__verified_sellers",
  label: "Verified sellers",
  type: "toggle",
};
export const DISCOUNT_FIELD: SidebarFilterField = {
  key: "__discount",
  label: "Discount",
  type: "toggle",
};

// "range" for number fields (min/max inputs, filtered numerically), "toggle" for
// booleans (Any/Yes/No), "checklist" for anything with a fixed option list -- select
// and tags formTypes both render as a multi-check list, the only difference being
// whether the stored value is a single string or an array (see arrayField above) --
// "text" (substring search) for everything else (free-typed fields like Make/Model,
// which have no fixed option list to check against).
function resolveFieldType(formType: string): SidebarFieldType {
  if (formType === "number") return "range";
  if (formType === "boolean") return "toggle";
  if (formType === "select" || formType === "tags") return "checklist";
  return "text";
}

export function getSidebarFields(
  topLevelSlug: string | undefined,
  leafSlug?: string
): SidebarFilterField[] {
  const keys = (leafSlug ? LEAF_SIDEBAR_FIELD_KEYS[leafSlug] : undefined) ?? (topLevelSlug ? SIDEBAR_FIELD_KEYS[topLevelSlug] : undefined);
  const defs = topLevelSlug ? getFieldsForCategory(topLevelSlug, leafSlug) : [];
  const categoryFields = (keys ?? [])
    .map((key) => defs.find((f) => f.key === key))
    .filter((f): f is NonNullable<typeof f> => Boolean(f))
    .map((f): SidebarFilterField => ({
      key: f.key,
      label: f.label,
      type: resolveFieldType(f.type),
      options: f.options,
      arrayField: f.type === "tags",
    }));

  return [...categoryFields, VERIFIED_SELLERS_FIELD, DISCOUNT_FIELD];
}

/** The attribute that best represents "sub-type" for this category's quick-filter row
 * (e.g. Make for vehicles, Property Type for property) -- undefined where no attribute
 * in our schema fits that role well. */
const QUICK_FILTER_KEY: Record<string, string> = {
  vehicles: "make",
  property: "property_type",
  "phones-tablets": "brand",
  electronics: "brand",
};

/** Leaf overrides: Cars/Buses still lead with Make (there's a real brand identity to
 * show), but the other vehicle leaves have no meaningful "make" filter -- their most
 * useful quick filter is the new leaf-specific Type field instead. */
const LEAF_QUICK_FILTER_KEY: Record<string, string> = {
  "motorcycles-scooters": "vehicle_type",
  "trucks-trailers": "vehicle_type",
  "construction-heavy-machinery": "vehicle_type",
  "watercraft-boats": "vehicle_type",
  "personal-mobility": "vehicle_type",
  "vehicle-parts-accessories": "vehicle_type",
  "vehicle-car-services": "vehicle_type",
};

export function getQuickFilterKey(topLevelSlug: string | undefined, leafSlug?: string): string | undefined {
  if (leafSlug && LEAF_QUICK_FILTER_KEY[leafSlug]) return LEAF_QUICK_FILTER_KEY[leafSlug];
  if (!topLevelSlug) return undefined;
  return QUICK_FILTER_KEY[topLevelSlug];
}

export type QuickFilterStyle = "brand" | "type";

/** "brand" categories render each value as a colored brand monogram (see BRAND_COLORS
 * below); "type" categories render a representative lucide icon per value instead --
 * there's no logo for "Apartment". */
const QUICK_FILTER_STYLE: Record<string, QuickFilterStyle> = {
  vehicles: "brand",
  "phones-tablets": "brand",
  electronics: "brand",
};

const LEAF_QUICK_FILTER_STYLE: Record<string, QuickFilterStyle> = {
  "motorcycles-scooters": "type",
  "trucks-trailers": "type",
  "construction-heavy-machinery": "type",
  "watercraft-boats": "type",
  "personal-mobility": "type",
  "vehicle-parts-accessories": "type",
  "vehicle-car-services": "type",
};

export function getQuickFilterStyle(topLevelSlug: string | undefined, leafSlug?: string): QuickFilterStyle {
  if (leafSlug && LEAF_QUICK_FILTER_STYLE[leafSlug]) return LEAF_QUICK_FILTER_STYLE[leafSlug];
  return (topLevelSlug && QUICK_FILTER_STYLE[topLevelSlug]) || "type";
}

// Real brand mark artwork isn't something this app has a license to embed, so brand
// values render as a monogram in the brand's actual identity color instead of a photo
// of their logo -- same purpose (instant recognition), no trademarked artwork involved.
const BRAND_COLORS: Record<string, string> = {
  Toyota: "#EB0A1E",
  Honda: "#E4002B",
  Ford: "#00095B",
  Hyundai: "#002C5F",
  Kia: "#05141F",
  "Mercedes-Benz": "#00A5C8",
  Nissan: "#C3002F",
  "Land Rover": "#1B4332",
  "Range Rover": "#1B4332",
  Cadillac: "#1A1A1A",
  Chevrolet: "#CD9834",
  Volkswagen: "#001E50",
  BMW: "#0066B1",
  Audi: "#BB0A30",
  Lexus: "#1A1A1A",
  Mazda: "#910A2D",
  Mitsubishi: "#E60012",
  Suzuki: "#E30016",
  Peugeot: "#0C0FF2",
  Jeep: "#425821",
  Volvo: "#003057",
  Samsung: "#1428A0",
  Apple: "#1A1A1A",
  Google: "#4285F4",
  Huawei: "#FF0000",
  Xiaomi: "#FF6900",
  Tecno: "#0072CE",
  Infinix: "#00A651",
  Itel: "#FF6600",
  Oppo: "#1A8A5C",
  Vivo: "#4157F2",
  Nokia: "#124191",
  HP: "#0096D6",
  Dell: "#007DB8",
  Lenovo: "#E2231A",
  Asus: "#1A1A1A",
  Acer: "#83B81A",
  Toshiba: "#DE1785",
};

const FALLBACK_BRAND_COLOR = "#516170";

export function getBrandColor(value: string): string {
  return BRAND_COLORS[value] ?? FALLBACK_BRAND_COLOR;
}

const PROPERTY_TYPE_ICONS: Record<string, LucideIcon> = {
  House: Home,
  Apartment: Building2,
  Land: Trees,
  Commercial: Building,
};

const TYPE_ICON_BY_CATEGORY: Record<string, Record<string, LucideIcon>> = {
  property: PROPERTY_TYPE_ICONS,
};

/** Icon per "Type" value for the 7 vehicle leaves that use the vehicle_type field as
 * their quick filter (see LEAF_TYPE_FIELD in listing-fields.ts for the option lists
 * these keys must match). Keyed by leaf slug, checked before TYPE_ICON_BY_CATEGORY. */
const TYPE_ICON_BY_LEAF: Record<string, Record<string, LucideIcon>> = {
  "motorcycles-scooters": {
    Scooter: Scooter,
    Cruiser: Bike,
    "Dual Sport": Bike,
    Motocross: Bike,
    "Quad (ATV)": Bike,
    "Sport Bike": Bike,
    Standard: Bike,
  },
  "trucks-trailers": {
    "Mini Truck": Truck,
    "Dump Truck": Truck,
    "Food Truck": Truck,
    "Heavy-Duty Truck": Truck,
    Trailer: Caravan,
  },
  "construction-heavy-machinery": {
    Forklift: Forklift,
    Tractor: Tractor,
    Excavator: HardHat,
    "Wheel Loader": HardHat,
    Grader: HardHat,
    "Backhoe Loader": HardHat,
    Bulldozer: HardHat,
  },
  "watercraft-boats": {
    Canoe: Sailboat,
    "Bow Rider Boat": Ship,
    "Banana Boat": Ship,
    "Barge & Pontoon": Ship,
    "Bass Boat": Ship,
    "Cabin Cruiser Boat": Ship,
  },
  "personal-mobility": {
    Bicycle: Bike,
    "Electric Bicycle": Bike,
    "Electric Scooter": Scooter,
    Hoverboard: Scooter,
    Accessories: Package,
  },
  "vehicle-parts-accessories": {
    "Wheels & Parts": Cog,
    "Engine & Drivetrain": Cog,
    "Exterior Accessories": Wrench,
    "Headlights & Lighting": Wrench,
    "Brakes, Suspension & Steering": Wrench,
    "Interior Accessories": Wrench,
    "Audio Parts": Wrench,
  },
  "vehicle-car-services": {
    "Tuning Services": Settings2,
    "Detailing Services": Wrench,
    "Car Repair": Wrench,
    Other: Wrench,
  },
};

export function getTypeIcon(topLevelSlug: string | undefined, value: string, leafSlug?: string): LucideIcon {
  const leafMap = leafSlug ? TYPE_ICON_BY_LEAF[leafSlug] : undefined;
  if (leafMap?.[value]) return leafMap[value];
  const map = (topLevelSlug && TYPE_ICON_BY_CATEGORY[topLevelSlug]) || {};
  return map[value] ?? Building;
}
