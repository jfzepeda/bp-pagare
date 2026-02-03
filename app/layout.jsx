import "./globals.css";

export const metadata = {
  title: "Pagaré PDF",
  description: "Generador de pagaré a PDF"
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>
        <div className="page-shell">
          {children}
        </div>
      </body>
    </html>
  );
}
