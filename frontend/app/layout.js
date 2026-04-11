import './globals.css'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
    title: 'UNSTACKED — Portfolio Clarity Engine',
    description: 'Understand what drives your portfolio, why it behaves that way, and where to focus attention.',
}

export default function RootLayout({ children }) {
    return (
        <html lang="en">
            <body className={inter.className}>{children}</body>
        </html>
    )
}
