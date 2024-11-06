// app/layout.js
import "./globals.css"

export const metadata = {
  title: "Chat Application",
  description: "A simple chat application using Next.js and Firebase",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
         <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Arvo:ital,wght@0,400;0,700;1,400;1,700&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  );
}
