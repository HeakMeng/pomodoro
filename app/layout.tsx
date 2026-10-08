import type { Metadata, Viewport } from "next";
import { Geist_Mono, Oswald } from "next/font/google";
import "./globals.css";
import { Shell } from "./components/Shell";
import { Providers } from "./providers";

const hornset = Oswald({
  variable: "--font-hornset",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Pomodoro Timer",
  description:
    "A minimalist Pomodoro timer with Focus, Short Break, and Long Break modes.",
  applicationName: "Pomodoro Timer",
  appleWebApp: {
    capable: true,
    title: "Pomodoro",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#0b2e6d",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${hornset.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        <Providers>
          <Shell>{children}</Shell>
        </Providers>
      </body>
    </html>
  );
}
