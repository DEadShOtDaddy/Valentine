import { createPhoto } from "@/app/api/utils/store";

const ADMIN_PASSWORD = "admin";

// Add a photo to a page
export async function POST(request) {
  try {
    // Simple password-based auth check via header
    const authHeader = request.headers.get("x-admin-auth");
    if (authHeader !== ADMIN_PASSWORD) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const photo = createPhoto(body);
    return Response.json({ photo });
  } catch (error) {
    console.error("Error adding photo:", error);
    return Response.json(
      { error: error?.message || "Failed to add photo" },
      { status: 400 }
    );
  }
}
