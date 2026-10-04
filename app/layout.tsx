import "./globals.css";
import type { Metadata } from "next";
export const metadata: Metadata={title:"Vercel List — Semua Project dalam Satu Tempat",description:"Dashboard TypeScript untuk memantau repository GitHub dan deployment Vercel."};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="id"><body>{children}</body></html>;}
