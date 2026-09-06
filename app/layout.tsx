import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '班級小本本｜教師、家庭與教室大螢幕',
  description: '把班級聯絡簿、作業追蹤與教室登記整理在一起。',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-Hant">
      <body>{children}</body>
    </html>
  );
}
