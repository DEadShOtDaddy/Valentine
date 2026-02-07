import {
  deletePage,
  getPageById,
  listPhotosForPage,
  updatePage,
} from "@/app/api/utils/store";

const ADMIN_PASSWORD = "admin";

// Get a single valentine page with photos
export async function GET(request, { params }) {
  try {
    const { id } = params;
    const page = getPageById(id);
    if (!page) {
      return Response.json({ error: "Page not found" }, { status: 404 });
    }
    const photos = listPhotosForPage(id);

    return Response.json({
      page,
      photos,
    });
  } catch (error) {
    console.error("Error fetching valentine page:", error);
    return Response.json({ error: "Failed to fetch page" }, { status: 500 });
  }
}

// Update a valentine page
export async function PUT(request, { params }) {
  try {
    // Simple password-based auth check via header
    const authHeader = request.headers.get("x-admin-auth");
    if (authHeader !== ADMIN_PASSWORD) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();
    const page = updatePage(id, body);
    if (!page) {
      return Response.json({ error: "Page not found" }, { status: 404 });
    }
    return Response.json({ page });
  } catch (error) {
    console.error("Error updating valentine page:", error);
    return Response.json(
      { error: error?.message || "Failed to update page" },
      { status: 400 }
    );
  }
}

// Delete a valentine page
export async function DELETE(request, { params }) {
  try {
    // Simple password-based auth check via header
    const authHeader = request.headers.get("x-admin-auth");
    if (authHeader !== ADMIN_PASSWORD) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    const deleted = deletePage(id);
    if (!deleted) {
      return Response.json({ error: "Page not found" }, { status: 404 });
    }
    return Response.json({ success: true });
  } catch (error) {
    console.error("Error deleting valentine page:", error);
    return Response.json({ error: "Failed to delete page" }, { status: 500 });
  }
}
