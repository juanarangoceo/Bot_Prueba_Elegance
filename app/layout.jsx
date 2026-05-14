export const metadata = {
  title: "Elegance Colombia — Jhonatan te atiende",
  description: "Catálogo de creación de contenido — Elegance Colombia",
  icons: { icon: "https://elegancecolombia.com/cdn/shop/files/Logo_animado.gif" },
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </head>
      <body style={{ margin: 0, padding: 0, background: "#111b21" }}>
        {children}
      </body>
    </html>
  );
}
