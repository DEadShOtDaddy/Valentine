import { createPage, getPageByDayNumber, listPages } from "@/app/api/utils/store";

const ADMIN_PASSWORD = "admin";

// Get all valentine pages
export async function GET(request) {
  try {
    const requestUrl = new URL(request.url);
    const day = requestUrl.searchParams.get("day");
    if (day !== null) {
      const page = getPageByDayNumber(day);
      if (!page) {
        return Response.json({ error: "Day not found" }, { status: 404 });
      }
      return Response.json({ page });
    }
    const pages = listPages();
    return Response.json({ pages });
  } catch (error) {
    console.error("Error fetching valentine pages:", error);
    return Response.json({ error: "Failed to fetch pages" }, { status: 500 });
  }
}

// Create a new valentine page
export async function POST(request) {
  try {
    // Simple password-based auth check via header
    const authHeader = request.headers.get("x-admin-auth");
    if (authHeader !== ADMIN_PASSWORD) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const page = createPage(body);
    return Response.json({ page });
  } catch (error) {
    console.error("Error creating valentine page:", error);
    return Response.json(
      { error: error?.message || "Failed to create page" },
      { status: 400 }
    );
  }
}
