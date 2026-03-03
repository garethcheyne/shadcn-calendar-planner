import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "React Calendar Planner",
  description: "A modern calendar planner built with shadcn/ui and Radix primitives",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  )
}
