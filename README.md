# 🛍️ Elegance Colombia — Bot Jhonatan

Demo de chatbot de ventas para WhatsApp, construido con Next.js + Gemini 3 Flash Preview.

## 🚀 Setup local

### 1. Instalar dependencias
```bash
npm install
```

### 2. Configurar API Key
Crea el archivo `.env.local` en la raíz del proyecto:
```bash
cp .env.example .env.local
```
Edita `.env.local` y pega tu API Key de Gemini:
```
GEMINI_API_KEY=AIza...tu_key_aqui
```
> Obtén tu key gratis en: https://aistudio.google.com/apikey

### 3. Correr en desarrollo
```bash
npm run dev
```
Abre http://localhost:3000

---

## ☁️ Deploy en Vercel

### Opción A — Desde GitHub (recomendado)
1. Sube este repo a GitHub
2. Ve a https://vercel.com/new
3. Importa el repositorio
4. En "Environment Variables" agrega:
   - **Name:** `GEMINI_API_KEY`
   - **Value:** tu API key de Gemini
5. Click en **Deploy**

### Opción B — Vercel CLI
```bash
npm i -g vercel
vercel
```
Cuando te pida las variables de entorno, agrega `GEMINI_API_KEY`.

---

## 📁 Estructura del proyecto

```
elegance-bot/
├── app/
│   ├── layout.jsx          # Layout raíz de Next.js
│   ├── page.jsx            # UI del chat (estilo WhatsApp)
│   └── api/
│       └── chat/
│           └── route.js    # API route — llama a Gemini
├── lib/
│   ├── products.js         # Catálogo completo con URLs de imágenes
│   └── prompt.js           # Prompt maestro de Jhonatan
├── .env.example            # Template de variables de entorno
├── .env.local              # TU API KEY (no subir al repo)
├── next.config.mjs
└── package.json
```

---

## 🔧 Personalización

### Cambiar productos
Edita `lib/products.js` — cada producto tiene:
- `id` — identificador único
- `nombre`, `descripcion`, `precio`, `precioAntes`, `descuento`
- `imagen` — URL directa al CDN de Shopify
- `categoria` — agrupa los productos
- `envioGratis` — si aplica envío gratis

### Mostrar imagen en el chat
Jhonatan puede mostrar fotos de productos si el cliente las pide.
En el prompt, usa el formato: `{{IMAGE:id_del_producto}}`
El sistema lo renderiza automáticamente como una tarjeta de producto.

### Ajustar la personalidad
Edita `lib/prompt.js` para cambiar el tono, nombre, o flujo de ventas.

---

## 🤖 Modelo usado
- **gemini-3-flash-preview** (Gemini 3 Flash)
- thinking_level: `low` (optimizado para latencia en chat)
- temperature: `1.0` (default recomendado por Google para Gemini 3)

---

## 📞 Contacto Elegance Colombia
WhatsApp: 302 391 2956  
Web: https://elegancecolombia.com
