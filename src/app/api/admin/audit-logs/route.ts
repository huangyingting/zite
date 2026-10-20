import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden: Admin role required" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const rawCat = searchParams.get("category") || "all";
  const catMap: Record<string, string> = {
    Authentication: "auth",
    "User Management": "user",
    Database: "db",
    Workflows: "workflow",
    Organization: "org",
  };
  const category = catMap[rawCat] || rawCat;
  const securityOnly =
    searchParams.get("securityCritical") === "true" ||
    searchParams.get("criticalOnly") === "true";
  const search = (searchParams.get("search") || "").trim().toLowerCase();
  const format = searchParams.get("format") || "json";

  const where: Record<string, unknown> = {};
  if (category && category !== "all") {
    where.category = category;
  }
  if (securityOnly) {
    where.securityCritical = true;
  }

  const logs = await prisma.auditLog.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 250,
  });

  const filtered = (search
    ? logs.filter(
        (l) =>
          l.eventType.toLowerCase().includes(search) ||
          (l.actorEmail || "").toLowerCase().includes(search) ||
          (l.targetName || "").toLowerCase().includes(search) ||
          l.payloadJson.toLowerCase().includes(search)
      )
    : logs
  ).map((l) => ({
    ...l,
    targetEmail: l.targetName,
    metadataJson: l.payloadJson,
  }));

  if (format === "csv") {
    const header = "timestamp,eventType,category,securityCritical,actorEmail,targetType,targetName,outcome,payload\n";
    const rows = filtered
      .map((l) =>
        [
          l.createdAt.toISOString(),
          l.eventType,
          l.category,
          l.securityCritical,
          l.actorEmail || "",
          l.targetType || "",
          l.targetName || "",
          l.outcome,
          `"${l.payloadJson.replace(/"/g, '""')}"`,
        ].join(",")
      )
      .join("\n");

    return new NextResponse(header + rows, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="zite-audit-logs.csv"',
      },
    });
  }

  return NextResponse.json({ logs: filtered });
}
