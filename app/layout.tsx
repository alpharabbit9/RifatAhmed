import type { Metadata } from "next";
import "@/styles/globals.css";
import { fontDisplay, fontSans, fontEditorial } from "@/lib/fonts";
import { SmoothScroll } from "@/components/motion/smooth-scroll";

export const metadata: Metadata = {
  title: "Rifat Ahmed — Full Stack Developer & AI Agent Builder",
  description:
    "Portfolio of Rifat Ahmed, a Full Stack Developer and AI Agent Builder.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${fontDisplay.variable} ${fontSans.variable} ${fontEditorial.variable}`}
    >
      <body>
        <SmoothScroll />
        {children}
      </body>
    </html>
  );
}
