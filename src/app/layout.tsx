import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { FontSizeProvider } from "@/components/font-size-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

// Applies a stored font-size preference before hydration so the page never
// flashes at the default size then jumps — same reasoning as next-themes'
// own blocking script for dark/light mode.
const FONT_SIZE_INIT_SCRIPT = `
(function () {
  try {
    var sizes = { sm: "87.5%", md: "100%", lg: "112.5%", xl: "125%" };
    var stored = localStorage.getItem("font-size");
    if (stored && sizes[stored]) {
      document.documentElement.style.fontSize = sizes[stored];
    }
  } catch (e) {}
})();
`;

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Universal Billing System",
  description: "Multi-tenant billing for agro and tyre shops.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <script dangerouslySetInnerHTML={{ __html: FONT_SIZE_INIT_SCRIPT }} />
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange>
          <FontSizeProvider>
            <TooltipProvider>
              {children}
              <Toaster />
            </TooltipProvider>
          </FontSizeProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
