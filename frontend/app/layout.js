import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});


export const metadata = {
  title: "VisionTutor — AI Study Tutor",
  description:
    "Real-time AI study tutor that sees your notes and hears your questions. Powered by Gemini Live API.",
  keywords: "AI tutor, study help, Gemini, real-time, voice, vision",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} antialiased`}>{children}</body>
    </html>
  );
}
