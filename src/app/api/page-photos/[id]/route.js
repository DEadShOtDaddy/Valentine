import { deletePhoto, updatePhoto } from "@/app/api/utils/store";

const ADMIN_PASSWORD = "admin";

// Update a photo
export async function PUT(request, { params }) {
  try {
    const authHeader = request.headers.get("x-admin-auth");
    if (authHeader !== ADMIN_PASSWORD) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();
    const photo = updatePhoto(id, body);
    if (!photo) {
      return Response.json({ error: "Photo not found" }, { status: 404 });
    }

    return Response.json({ photo });
  } catch (error) {
    console.error("Error updating photo:", error);
    return Response.json(
      { error: error?.message || "Failed to update photo" },
      { status: 400 }
    );
  }
}

// Delete a photo
export async function DELETE(request, { params }) {
  try {
    const authHeader = request.headers.get("x-admin-auth");
    if (authHeader !== ADMIN_PASSWORD) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    const deleted = deletePhoto(id);
    if (!deleted) {
      return Response.json({ error: "Photo not found" }, { status: 404 });
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error("Error deleting photo:", error);
    return Response.json({ error: "Failed to delete photo" }, { status: 500 });
  }
}
