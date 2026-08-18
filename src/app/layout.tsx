import type { Metadata } from "next";
import { Hanken_Grotesk } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/context/CartContext";
import { StoreProvider } from "@/context/StoreContext";
import { PromoProvider } from "@/context/PromoContext";
import { LiveVoiceProvider } from "@/context/LiveVoiceContext";
import ChatShell from "@/components/ChatShell";

const hankenGrotesk = Hanken_Grotesk({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-hanken",
  display: "swap",
});

export const metadata: Metadata = {
  title: "SM Markets",
  description: "Shop groceries online at SM Markets – fresh produce, meat, dairy and more delivered to your door.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${hankenGrotesk.variable} h-full`}>
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
        />
      </head>
      <body className="min-h-full flex flex-col">
        <StoreProvider>
          <CartProvider>
            <PromoProvider>
              <LiveVoiceProvider>
                {children}
                <ChatShell />
              </LiveVoiceProvider>
            </PromoProvider>
          </CartProvider>
        </StoreProvider>
      </body>
    </html>
  );
}
