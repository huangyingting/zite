import { NextResponse } from "next/server";
import { validateInvitationToken } from "@/lib/account-admission/invitations";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token") || "";
  const result = await validateInvitationToken(token);
  return NextResponse.json(result, { status: result.valid ? 200 : 400 });
}
