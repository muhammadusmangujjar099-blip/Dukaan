import type { Metadata } from "next";
import { Bricolage_Grotesque, DM_Sans } from "next/font/google";
import { Toaster } from "sonner";
import { ChatWidget } from "@/components/chat-widget";
import { Footer } from "@/components/footer";
import { Navbar } from "@/components/navbar";
import "./globals.css";

const display = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-display", display: "swap" });
const body = DM_Sans({ subsets: ["latin"], variable: "--font-body", display: "swap" });

export const metadata: Metadata = {
  title: "Dukaan – shop smarter with an AI assistant",
  description: "Phones, laptops, audio and more. Tell the assistant your budget and it finds the right product.",
  icons: { icon: "/favicon.svg" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body className="min-h-screen">
        <Navbar />
        <main>{children}</main>
        <Footer />
        <ChatWidget />
        <Toaster position="bottom-left" />
      </body>
    </html>
  );
}
