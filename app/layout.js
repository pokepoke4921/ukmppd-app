export const metadata = { title: "UKMPPD Study App" };
export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body style={{ margin: 0, padding: "1rem", background: "#fff" }}>{children}</body>
    </html>
  );
}
