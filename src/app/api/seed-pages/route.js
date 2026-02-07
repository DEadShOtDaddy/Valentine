import { seedValentinePages } from "@/app/api/utils/seed";

export async function POST(request) {
  try {
    // Simple auth check
    const authHeader = request.headers.get("x-admin-auth");
    if (authHeader !== "admin") {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    let forceReset = false;
    try {
      const body = await request.json();
      forceReset = body?.forceReset === true;
    } catch {
      forceReset = false;
    }

    const result = await seedValentinePages({ forceReset });
    return Response.json(result);
  } catch (error) {
    console.error("Error in seed endpoint:", error);
    return Response.json({ error: "Failed to seed pages" }, { status: 500 });
  }
}
