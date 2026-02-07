import { seedValentinePagesInStore } from "@/app/api/utils/store";

export async function seedValentinePages(options) {
  try {
    return seedValentinePagesInStore(options);
  } catch (error) {
    console.error("Error seeding Valentine pages:", error);
    return { success: false, error: error?.message || "Unknown error" };
  }
}
