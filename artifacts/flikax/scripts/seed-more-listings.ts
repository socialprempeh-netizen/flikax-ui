/**
 * One-off seed: inserts 20 Ghana-flavored real-world listings (Vehicles,
 * Electronics, Property, Fashion, ...) across Accra/Kumasi/Tema/Takoradi,
 * each with a real Unsplash cover photo.
 *
 * Usage:
 *   npx tsx scripts/seed-more-listings.ts --dry-run
 *   npx tsx scripts/seed-more-listings.ts
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY in .env.local (RLS requires user_id to
 * match the inserting session, which a script has no session for -- the
 * service-role client bypasses RLS entirely instead).
 *
 * Seller attribution: reuses whichever profile already owns the most active
 * listings (the site's existing demo/seed account -- see DATABASE.md's note
 * that the base schema predates any committed seed script) rather than
 * hardcoding a UUID or attaching these to a real person's account.
 */
import { readFileSync } from "fs";
import { createClient } from "@supabase/supabase-js";
import type { Database, Json } from "../src/lib/supabase/database.types";

function loadEnv() {
  const env = readFileSync(".env.local", "utf-8");
  for (const line of env.split("\n")) {
    // No trailing `$` anchor -- this file has CRLF line endings, and `.` in
    // JS regex excludes \r (a line-terminator char), so `(.*)$` never
    // matches through to end-of-line and silently produces zero matches.
    const m = line.match(/^([A-Z_0-9]+)=(.*)/);
    if (m) process.env[m[1]] = m[2].trim();
  }
}

type SeedListing = {
  title: string;
  description: string;
  price: number;
  location: "Accra" | "Kumasi" | "Tema" | "Takoradi";
  categorySlug: string;
  attributes: Record<string, unknown>;
  imageUrl: string;
  imageWidth: number;
  imageHeight: number;
  negotiable?: "yes" | "no";
};

const LISTINGS: SeedListing[] = [
  // -- Vehicles --
  {
    title: "Toyota Corolla 2016 - Very Neat",
    description:
      "Clean Toyota Corolla 2016, foreign used, accident-free, papers up to date. Cold AC, alloy rims, good tires all round. Buy and drive.",
    price: 68500,
    location: "Accra",
    categorySlug: "cars",
    attributes: {
      make: "Toyota", model: "Corolla", year: "2016", condition: "Foreign Used", color: "Silver",
      body_type: "Sedan", transmission: "Automatic", fuel_type: "Petrol", mileage: "98000",
      key_features: ["Air Conditioning", "Alloy Wheels", "Electric Windows"],
    },
    imageUrl: "https://images.unsplash.com/photo-1552519507-da3b142c6e3d",
    imageWidth: 1200, imageHeight: 800,
    negotiable: "yes",
  },
  {
    title: "Toyota Hilux 2019 4WD Pickup",
    description:
      "Toyota Hilux 2019, 4WD, diesel engine, low mileage. Perfect for construction/business use or personal off-road driving. Very strong engine.",
    price: 210000,
    location: "Kumasi",
    categorySlug: "cars",
    attributes: {
      make: "Toyota", model: "Hilux", year: "2019", condition: "Foreign Used", color: "White",
      body_type: "Pickup", transmission: "Manual", fuel_type: "Diesel", mileage: "62000",
      key_features: ["Air Conditioning", "Power Steering", "Reverse Camera"],
    },
    imageUrl: "https://images.unsplash.com/photo-1519641471654-76ce0107ad1b",
    imageWidth: 1200, imageHeight: 800,
    negotiable: "yes",
  },
  {
    title: "Hyundai Elantra 2018",
    description:
      "Hyundai Elantra 2018 for sale. Fuel efficient, smooth automatic gearbox, chilled AC. First body, no accident. Serious buyers only.",
    price: 78000,
    location: "Tema",
    categorySlug: "cars",
    attributes: {
      make: "Hyundai", model: "Elantra", year: "2018", condition: "Foreign Used", color: "White",
      body_type: "Sedan", transmission: "Automatic", fuel_type: "Petrol", mileage: "71000",
      key_features: ["Air Conditioning", "Bluetooth", "Cruise Control"],
    },
    imageUrl: "https://images.unsplash.com/photo-1494905998402-395d579af36f",
    imageWidth: 1200, imageHeight: 800,
    negotiable: "yes",
  },
  {
    title: "Honda CR-V 2015 SUV - Family Car",
    description:
      "Honda CR-V 2015, spacious family SUV, leather interior, sunroof. Runs perfectly, ready for immediate use. Located in Takoradi, can arrange inspection.",
    price: 92000,
    location: "Takoradi",
    categorySlug: "cars",
    attributes: {
      make: "Honda", model: "CR-V", year: "2015", condition: "Foreign Used", color: "Gray",
      body_type: "SUV", transmission: "Automatic", fuel_type: "Petrol", mileage: "110000",
      key_features: ["Leather Seats", "Sunroof", "Air Conditioning"],
    },
    imageUrl: "https://images.unsplash.com/photo-1503376780353-7e6692767b70",
    imageWidth: 1200, imageHeight: 800,
    negotiable: "yes",
  },
  {
    title: "Bajaj Boxer 150cc Motorbike - Brand New",
    description:
      "Brand new Bajaj Boxer 150cc motorbike, ideal for commercial (okada) or personal use. Comes with full papers and 1-year warranty.",
    price: 9800,
    location: "Accra",
    categorySlug: "motorcycles-scooters",
    attributes: { make: "Bajaj", model: "Boxer", year: "2026", condition: "New", color: "Black" },
    imageUrl: "https://images.unsplash.com/photo-1558981806-ec527fa84c39",
    imageWidth: 1200, imageHeight: 800,
    negotiable: "no",
  },

  // -- Electronics / Phones & Tablets --
  {
    title: "iPhone 14 Pro Max 256GB - East Legon",
    description:
      "Clean iPhone 14 Pro Max, 256GB, Deep Purple. Battery health 92%, no cracks, no repairs. Comes with box, charger and original cable. Meet in East Legon, Accra.",
    price: 12500,
    location: "Accra",
    categorySlug: "mobile-phones",
    attributes: {
      brand: "Apple", storage: "256GB", condition: "Foreign Used", color: "Purple",
      key_features: ["Face ID / Fingerprint Scanner", "Fast Charging", "5G"],
    },
    imageUrl: "https://images.unsplash.com/photo-1592286927505-1def25115558",
    imageWidth: 1200, imageHeight: 900,
    negotiable: "yes",
  },
  {
    title: "Samsung Galaxy S23 Ultra 256GB",
    description:
      "Samsung Galaxy S23 Ultra, 256GB storage, S-Pen included. Excellent camera, still under local warranty. No issues at all, screen is flawless.",
    price: 9200,
    location: "Kumasi",
    categorySlug: "mobile-phones",
    attributes: {
      brand: "Samsung", storage: "256GB", condition: "Foreign Used", color: "Black",
      key_features: ["Fast Charging", "5G", "Dual SIM"],
    },
    imageUrl: "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c",
    imageWidth: 1200, imageHeight: 800,
    negotiable: "yes",
  },
  {
    title: "MacBook Pro 13-inch M2 2022",
    description:
      "MacBook Pro 13-inch, M2 chip, 8GB RAM, 256GB SSD. Barely used, still has Apple warranty. Great for students and professionals -- fast and reliable.",
    price: 14000,
    location: "Tema",
    categorySlug: "laptops-computers",
    attributes: {
      brand: "Apple", condition: "Foreign Used", color: "Silver",
      key_features: ["Warranty Included", "Bluetooth"],
    },
    imageUrl: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8",
    imageWidth: 1200, imageHeight: 800,
    negotiable: "yes",
  },
  {
    title: "Samsung 55-inch Smart 4K TV",
    description:
      "Samsung 55-inch Crystal UHD 4K Smart TV. Netflix, YouTube, screen mirroring all working perfectly. Barely used, selling due to relocation.",
    price: 6800,
    location: "Takoradi",
    categorySlug: "tv-video-equipment",
    attributes: {
      brand: "Samsung", condition: "Foreign Used",
      key_features: ["Smart / WiFi Enabled", "Bluetooth"],
    },
    imageUrl: "https://images.unsplash.com/photo-1593305841991-05c297ba4575",
    imageWidth: 1200, imageHeight: 800,
    negotiable: "yes",
  },
  {
    title: "Sony PlayStation 5 Console",
    description:
      "Sony PlayStation 5 (disc edition) with one controller. Works perfectly, no issues. Comes with original box and all cables.",
    price: 7500,
    location: "Accra",
    categorySlug: "video-game-consoles",
    attributes: { brand: "Sony", condition: "Foreign Used", color: "White" },
    imageUrl: "https://images.unsplash.com/photo-1622297845775-5ff3fef71d13",
    imageWidth: 1200, imageHeight: 800,
    negotiable: "yes",
  },

  // -- Property --
  {
    title: "3-Bedroom House For Sale - East Legon",
    description:
      "Newly built 3-bedroom house in a serene, gated area of East Legon, Accra. All rooms en-suite, fitted kitchen, boys' quarters, ample parking. Indenture available.",
    price: 1850000,
    location: "Accra",
    categorySlug: "houses-apartments-for-sale",
    attributes: {
      property_type: "House", bedrooms: "3", bathrooms: "3", furnished: "Partly",
      key_features: ["Gated Community", "Fitted Kitchen", "Parking Space", "Boys Quarters"],
    },
    imageUrl: "https://images.unsplash.com/photo-1568605114967-8130f3a36994",
    imageWidth: 1200, imageHeight: 800,
    negotiable: "yes",
  },
  {
    title: "2-Bedroom Furnished Apartment For Rent - Ridge",
    description:
      "Well-furnished 2-bedroom apartment for rent at Ridge, Kumasi. 24-hour security, backup water supply, close to shopping mall. 1 year advance required.",
    price: 3500,
    location: "Kumasi",
    categorySlug: "houses-apartments-for-rent",
    attributes: {
      property_type: "Apartment", bedrooms: "2", bathrooms: "2", furnished: "Yes",
      key_features: ["CCTV Security", "Borehole / Water Supply", "Parking Space"],
    },
    imageUrl: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688",
    imageWidth: 1200, imageHeight: 800,
    negotiable: "no",
  },
  {
    title: "Registered Land For Sale - Kpone, Tema",
    description:
      "One plot of registered land for sale at Kpone, near Tema. Site plan and indenture ready, free from litigation. Suitable for residential development.",
    price: 120000,
    location: "Tema",
    categorySlug: "land-plots-for-sale",
    attributes: { property_type: "Land" },
    imageUrl: "https://images.unsplash.com/photo-1500382017468-9049fed747ef",
    imageWidth: 1200, imageHeight: 800,
    negotiable: "yes",
  },
  {
    title: "Commercial Office Space For Rent - Takoradi",
    description:
      "Modern office space for rent in Takoradi's business district. Open-plan layout, reception area, ample parking, reliable power supply. Ideal for a growing business.",
    price: 4200,
    location: "Takoradi",
    categorySlug: "commercial-property-for-rent",
    attributes: {
      property_type: "Commercial",
      key_features: ["Parking Space", "CCTV Security", "Air Conditioning"],
    },
    imageUrl: "https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83",
    imageWidth: 1200, imageHeight: 800,
    negotiable: "yes",
  },

  // -- Fashion --
  {
    title: "Original Nike Air Max Sneakers - Size 42",
    description:
      "Brand new, 100% original Nike Air Max sneakers, size 42. Never worn, still in box. Great for everyday wear or the gym.",
    price: 650,
    location: "Accra",
    categorySlug: "mens-fashion",
    attributes: { brand: "Nike", condition: "New", color: "White", size: "42" },
    imageUrl: "https://images.unsplash.com/photo-1542291026-7eec264c27ff",
    imageWidth: 1200, imageHeight: 900,
    negotiable: "yes",
  },
  {
    title: "Ankara Print Dress - Ladies Wear",
    description:
      "Beautiful custom-made Ankara print dress, true to size, well finished. Perfect for parties, church or everyday African-print fashion.",
    price: 280,
    location: "Kumasi",
    categorySlug: "womens-fashion",
    attributes: { condition: "New", color: "Multicolor", size: "M" },
    imageUrl: "https://images.unsplash.com/photo-1585487000160-6ebcfceb0d03",
    imageWidth: 1200, imageHeight: 800,
    negotiable: "yes",
  },
  {
    title: "Kids Clothing Set (3-5 Years)",
    description:
      "Set of quality children's clothing for ages 3-5. Includes tops, shorts and a light jacket. Barely worn, from a smoke-free home.",
    price: 150,
    location: "Tema",
    categorySlug: "baby-kids-fashion",
    attributes: { condition: "Locally Used", size: "3-5 Years" },
    imageUrl: "https://images.unsplash.com/photo-1445205170230-053b83016050",
    imageWidth: 1200, imageHeight: 800,
    negotiable: "yes",
  },

  // -- Home, Furniture & Appliances --
  {
    title: "Samsung Double-Door Fridge - No Frost",
    description:
      "Samsung double-door no-frost refrigerator. Excellent cooling, very low power consumption. Selling because we're upgrading to a bigger size.",
    price: 4500,
    location: "Takoradi",
    categorySlug: "home-appliances",
    attributes: { material: "Steel", condition: "Used", color: "Silver", key_features: ["Energy Efficient"] },
    imageUrl: "https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5",
    imageWidth: 1200, imageHeight: 800,
    negotiable: "yes",
  },

  // -- Repair & Construction / Commercial Equipment --
  {
    title: "10KVA Soundproof Generator",
    description:
      "10KVA soundproof standby generator, perfect for homes, shops and small offices during power outages. Fuel efficient, starts easily, well maintained.",
    price: 18500,
    location: "Accra",
    categorySlug: "electrical-equipment",
    attributes: { brand: "Tiger", condition: "Foreign Used" },
    imageUrl: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e",
    imageWidth: 1200, imageHeight: 800,
    negotiable: "yes",
  },
  {
    title: "Commercial Deep Fryer & Catering Equipment Set",
    description:
      "Set of commercial catering equipment: deep fryer, warming trays and food containers. Ideal for a chop bar, restaurant or catering business start-up.",
    price: 3200,
    location: "Kumasi",
    categorySlug: "restaurant-catering-equipment",
    attributes: { condition: "Used" },
    imageUrl: "https://images.unsplash.com/photo-1466637574441-749b8f19452f",
    imageWidth: 1200, imageHeight: 800,
    negotiable: "yes",
  },
];

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  loadEnv();

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    console.error("SUPABASE_SERVICE_ROLE_KEY is not set in .env.local -- required to bypass RLS for a seed script.");
    process.exit(1);
  }

  const admin = createClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const slugs = [...new Set(LISTINGS.map((l) => l.categorySlug))];
  const { data: categories, error: catError } = await admin.from("categories").select("id, slug").in("slug", slugs);
  if (catError) {
    console.error("Failed to load categories:", catError.message);
    process.exit(1);
  }
  const categoryIdBySlug = new Map((categories ?? []).map((c) => [c.slug, c.id]));
  const missingSlugs = slugs.filter((s) => !categoryIdBySlug.has(s));
  if (missingSlugs.length > 0) {
    console.error("Unknown category slug(s), aborting:", missingSlugs.join(", "));
    process.exit(1);
  }

  // Whichever profile already owns the most active listings is treated as
  // the site's existing demo/seed seller -- reused here instead of
  // hardcoding a UUID or attributing these to a real person's account.
  const { data: sample, error: sampleError } = await admin
    .from("listings")
    .select("user_id")
    .eq("status", "active")
    .limit(500);
  if (sampleError) {
    console.error("Failed to sample existing listings for a seller id:", sampleError.message);
    process.exit(1);
  }
  const counts = new Map<string, number>();
  for (const row of sample ?? []) counts.set(row.user_id, (counts.get(row.user_id) ?? 0) + 1);
  const sellerId = [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
  if (!sellerId) {
    console.error("No existing listings found to infer a seller profile id from. Pass one in manually.");
    process.exit(1);
  }
  console.log(`Seller profile: ${sellerId} (owns ${counts.get(sellerId)} existing active listing(s))`);

  console.log(`${LISTINGS.length} listing(s) to insert.` + (dryRun ? " [DRY RUN -- nothing will be written]" : ""));

  let succeeded = 0;
  let failed = 0;

  for (const seed of LISTINGS) {
    const categoryId = categoryIdBySlug.get(seed.categorySlug)!;

    if (dryRun) {
      console.log(`[dry-run] would insert "${seed.title}" (${seed.categorySlug}, ${seed.location}, GHS ${seed.price})`);
      continue;
    }

    const { data: listing, error: listingError } = await admin
      .from("listings")
      .insert({
        user_id: sellerId,
        category_id: categoryId,
        title: seed.title,
        description: seed.description,
        price: seed.price,
        location: seed.location,
        // seed.attributes is a plain object literal per-listing (Record<string,
        // unknown>) -- `unknown` isn't assignable to the generated Json union, but
        // every value here is itself JSON-safe (strings/arrays), so this is a type
        // annotation gap, not a real runtime risk.
        attributes: seed.attributes as Json,
        negotiable: seed.negotiable ?? "yes",
        status: "active",
        contact_phone: "0244000000",
      })
      .select("id")
      .single();

    if (listingError || !listing) {
      failed++;
      console.error(`FAILED "${seed.title}":`, listingError?.message ?? "no row returned");
      continue;
    }

    const { error: imageError } = await admin.from("listing_images").insert({
      listing_id: listing.id,
      storage_path: seed.imageUrl,
      position: 0,
      width: seed.imageWidth,
      height: seed.imageHeight,
    });

    if (imageError) {
      failed++;
      console.error(`FAILED image for "${seed.title}" (listing ${listing.id} was created):`, imageError.message);
      continue;
    }

    succeeded++;
    console.log(`OK "${seed.title}" -> ${listing.id}`);
  }

  console.log(`\nDone. ${succeeded} succeeded, ${failed} failed` + (dryRun ? " (dry run, nothing written)." : "."));
}

main();
