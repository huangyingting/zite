import { NextResponse } from "next/server";
import { acceptInvitation } from "@/lib/account-admission/invitations";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      token?: string;
      name?: string;
      password?: string;
    };

    if (!body.token) {
      return NextResponse.json(
        { error: "Invitation token is required. Self-serve signup is disabled." },
        { status: 403 }
      );
    }

    const user = await acceptInvitation({
      rawToken: body.token,
      name: body.name || "",
      password: body.password || "",
    });

    return NextResponse.json(
      {
        ok: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      },
      { status: 201 }
    );
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to accept invitation" },
      { status: 400 }
    );
  }
}
