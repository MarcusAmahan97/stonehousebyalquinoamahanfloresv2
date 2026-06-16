import "./globals.css";

export const metadata = {
  title: "Kuya Weng's | Order Tracking System",
  description: "Buda Highlands Resort Operations",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased bg-[#fbfbf9] text-slate-900">
        {children}
      </body>
    </html>
  );
}