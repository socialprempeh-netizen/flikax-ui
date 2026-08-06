"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { createClient, getUser } from "@/lib/supabase/server";

// Takes a FormData id (from DeleteListingButton's hidden input) rather than
// a typed argument, since it's bound directly as a <form action={...}>
// handler -- Next.js server actions used that way always receive the form's
// FormData as their sole argument.
export async function deleteListingAction(formData: FormData) {
  const id = formData.get("id");
  if (typeof id !== "string") return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await getUser();
  if (!user) return;

  // .eq("user_id", user.id) is the actual ownership check -- there's no
  // separate "is this my listing?" lookup beforehand. If the id belongs to
  // someone else, this query simply matches zero rows and deletes nothing;
  // it fails closed rather than needing an explicit authorization branch.
  await supabase.from("listings").delete().eq("id", id).eq("user_id", user.id);
  // Both a path revalidation AND the "listings" tag: the tag catches every
  // unstable_cache-wrapped query keyed to it (home/category listing feeds),
  // while the explicit paths catch this dashboard route and the homepage/
  // category shells that aren't behind that same cache tag.
  revalidateTag("listings");
  revalidatePath("/dashboard");
  revalidatePath("/", "page");
  revalidatePath("/[category]", "page");
}
