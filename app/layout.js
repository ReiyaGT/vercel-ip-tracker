export const metadata = {
  title: 'Vercel IP Tracker',
  description: 'Track visitor IP and city',
}

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body>
        {children}
      </body>
    </html>
  )
}
