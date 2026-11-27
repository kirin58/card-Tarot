export const metadata = {
  title: "ไพ่ทาโรต์",
  description: "เปิดไพ่เพื่อรับคำแนะนำ",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <body>{children}</body>
    </html>
  );
}