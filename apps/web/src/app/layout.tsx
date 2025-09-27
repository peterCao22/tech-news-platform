import './globals.css'

export const metadata = {
  title: '科技新闻聚合平台',
  description: 'AI驱动的智能新闻筛选系统',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
