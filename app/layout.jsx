import './globals.css'
import { Toaster } from "@/components/ui/toaster"

export default function RootLayout({
  children,
}) {
  return (
    <html lang="en">
      <head>
      </head>
      <body>
        {children}
        <Toaster />
      </body>
    </html>
  )
}
