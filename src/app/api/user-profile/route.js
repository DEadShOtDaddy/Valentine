import sql from "@/app/api/utils/sql";
import { auth } from "@/auth";

// Get current user's profile
export async function GET() {
  try {
    const session = await auth();
    if (!session) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profile = await sql`
      SELECT * FROM user_profiles WHERE user_id = ${session.user.id}
    `;

    return Response.json({ profile: profile[0] || null });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return Response.json({ error: "Failed to fetch profile" }, { status: 500 });
  }
}

// Create or update user profile
export async function POST(request) {
  try {
    const session = await auth();
    if (!session) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { username } = body;

    // Check if profile exists
    const existing = await sql`
      SELECT * FROM user_profiles WHERE user_id = ${session.user.id}
    `;

    if (existing.length > 0) {
      // Update existing profile
      const updated = await sql`
        UPDATE user_profiles 
        SET username = ${username}
        WHERE user_id = ${session.user.id}
        RETURNING *
      `;
      return Response.json({ profile: updated[0] });
    } else {
      // Create new profile
      const newProfile = await sql`
        INSERT INTO user_profiles (user_id, username, role)
        VALUES (${session.user.id}, ${username}, 'user')
        RETURNING *
      `;
      return Response.json({ profile: newProfile[0] });
    }
  } catch (error) {
    console.error("Error creating/updating profile:", error);
    return Response.json({ error: "Failed to save profile" }, { status: 500 });
  }
}
