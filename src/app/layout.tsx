import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/Providers";

export const metadata: Metadata = {
  title: "Zite — The AI builder that means business",
  description:
    "Create internal tools, customer portals, CRMs, databases, and backend workflows with AI over one unified workspace.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#FAF9F5] text-[#141413] antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
