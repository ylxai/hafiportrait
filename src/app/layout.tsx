import type { Metadata } from 'next'
import { Providers } from './providers'
import "./globals.css";
import "@/styles/colors.css";
import "@/styles/scroll-animations.css";
import "@/styles/photo-grid-animations.css";
import "@/styles/enhanced-homepage.css";
import "@/styles/logo-fonts.css";
// Removed Vercel SpeedInsights and Analytics for VPS production
// import { SpeedInsights } from '@vercel/speed-insights/next'
// import { Analytics } from '@vercel/analytics/react'

export const metadata: Metadata = {
  title: 'Hafi Portrait - Photo Sharing untuk Event',
  description: 'Platform berbagi foto untuk event dan acara spesial',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <link 
          href="https://fonts.googleapis.com/css2?family=Bilbo+Swash+Caps&family=Mrs+Saint+Delafield&display=swap" 
          rel="stylesheet" 
        />
        <link 
          href="https://fonts.googleapis.com/css2?family=Bilbo+Swash+Caps&family=Fleur+De+Leah&display=swap" 
          rel="stylesheet" 
        />
        <link 
          href="https://fonts.googleapis.com/css2?family=Bilbo+Swash+Caps&family=Edu+TAS+Beginner:wght@400..700&family=Fleur+De+Leah&display=swap" 
          rel="stylesheet" 
        />
        <link 
          href="https://fonts.googleapis.com/css2?family=Lavishly+Yours&family=Story+Script&display=swap" 
          rel="stylesheet" 
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Suppress Chrome extension errors
              window.addEventListener('error', function(e) {
                if (e.filename && (e.filename.includes('contentScript.js') || e.filename.includes('injected.js'))) {
                  e.preventDefault();
                  return false;
                }
              });
              
              // Suppress unhandled promise rejections from extensions
              window.addEventListener('unhandledrejection', function(e) {
                if (e.reason && e.reason.stack && (e.reason.stack.includes('contentScript') || e.reason.stack.includes('injected'))) {
                  e.preventDefault();
                  return false;
                }
              });
            `
          }}
        />
      </head>
      <body className="font-sans antialiased">
        <Providers>
          {children}
        </Providers>
        {/* Vercel instrumentation removed for VPS */}
      </body>
    </html>
  )
} 