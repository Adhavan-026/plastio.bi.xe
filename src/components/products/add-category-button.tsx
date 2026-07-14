"use client";

import { useRouter } from "next/navigation";
import { AddCategoryDialog } from "@/components/products/add-category-dialog";

/** Standalone "Add category" trigger for the (segmented) products page — creates
 * the category then refreshes the server-rendered groups so its new box appears. */
export function AddCategoryButton() {
  const router = useRouter();
  return <AddCategoryDialog onCreated={() => router.refresh()} />;
}
