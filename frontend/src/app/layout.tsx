import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "../index.css";
import { AuthProvider } from "../context/AuthContext";
import { SocketProvider } from "../context/SocketContext";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

export const metadata: Metadata = {
  title: "Sync Pad - Real-Time Collaboration Hub",
  description: "A production-ready SaaS workspace platform featuring collaborative document editing, team chat, file sharing, and live multiplayer synchronization.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`h-full antialiased dark ${inter.variable} ${outfit.variable}`}>
      <body className="min-h-full bg-background text-foreground font-sans flex flex-col">
        <AuthProvider>
          <SocketProvider>
            {children}
          </SocketProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
