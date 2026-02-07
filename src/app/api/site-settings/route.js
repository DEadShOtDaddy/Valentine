import { getSiteSettings, updateSiteSettings } from "@/app/api/utils/store";

const ADMIN_PASSWORD = "admin";

export async function GET() {
  try {
    const settings = getSiteSettings();
    return Response.json({ settings });
  } catch (error) {
    console.error("Error fetching site settings:", error);
    return Response.json({ error: "Failed to fetch site settings" }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const authHeader = request.headers.get("x-admin-auth");
    if (authHeader !== ADMIN_PASSWORD) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const settings = updateSiteSettings(body || {});
    return Response.json({ settings });
  } catch (error) {
    console.error("Error updating site settings:", error);
    return Response.json(
      { error: error?.message || "Failed to update site settings" },
      { status: 400 }
    );
  }
}
