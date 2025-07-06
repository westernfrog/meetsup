import { Geist_Mono, Outfit } from "next/font/google";
import "./globals.css";
import Aside from "@/components/aside/Aside";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import QProvider from "@/contexts/QProvider";

const outfitSans = Outfit({
  variable: "--font-outfit-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Meetsup",
  description:
    "Meetsup is a real-time chat app for anonymous 1-on-1 messaging and global discussions. Enjoy instant communication with typing indicators, secure chat rooms, and seamless performance—no signup required.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning={true}>
      <body
        className={`${outfitSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider>
          <QProvider>
            <AuthProvider>
              <div className="fixed inset-0">
                <div className="grid grid-cols-12 grid-rows-12 h-full">
                  <div className="col-span-3 border-r row-span-12 overflow-hidden">
                    <div className="p-2 h-full">
                      <Aside />
                    </div>
                  </div>
                  <div className="col-span-9 row-span-12 overflow-hidden">
                    <div className="h-full">{children}</div>
                  </div>
                </div>
              </div>
            </AuthProvider>
          </QProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
