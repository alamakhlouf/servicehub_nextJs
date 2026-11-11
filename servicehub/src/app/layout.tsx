import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import { ServiceWorkerRegistration } from "@/components/layout/service-worker-registration";
import { Navigation } from "@/components/layout/navigation";
import { getCurrentUser } from "@/lib/auth/users";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ServiceHub",
  description: "A marketplace for local services, suppliers, and workshops.",
  manifest: "/manifest.webmanifest",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const user = await getCurrentUser();
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jakarta.variable} h-full antialiased`}
    >
      <body className="min-h-full overflow-x-hidden bg-background font-sans text-text">
        <ServiceWorkerRegistration />
        <Navigation user={user} />
        <main className="min-w-0 lg:ml-64">{children}</main>
      </body>
    </html>
  );
}
