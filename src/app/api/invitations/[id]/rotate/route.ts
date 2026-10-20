import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { rotateInvitation } from "@/lib/account-admission/invitations";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden: Admin role required" }, { status: 403 });
  }

  try {
    const { id } = await context.params;
    const body = await request.json().catch(() => ({}));
    const result = await rotateInvitation({
      invitationId: id,
      actorUserId: user.id,
      actorEmail: user.email,
      expiresInHours: body.expiresInHours ?? 72,
    });
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to rotate invitation" },
      { status: 400 }
    );
  }
}
