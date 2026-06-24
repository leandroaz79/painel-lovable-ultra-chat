# Setup do Sistema de Branding

## 1. Copiar para seu projeto React/Vite

Copie as pastas para seu projeto:

```
seu-projeto/
├── public/
│   └── templates/
│       └── lovable-ultra-chat-5.4-1R.zip    ← copie esta pasta inteira
├── src/
│   └── utils/
│       └── extensionBuilder.ts               ← copie este arquivo
│   └── components/
│       └── BrandingGenerator.tsx             ← copie este arquivo
```

## 2. Instalar dependência

```bash
npm install jszip
```

## 3. Usar na página de admin

```tsx
import BrandingGenerator from "./components/BrandingGenerator";

export default function AdminPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <BrandingGenerator />
    </div>
  );
}
```

## 4. Pronto!

O template está em `public/templates/` — o Vite serve estaticamente.
O fetch carrega local, sem latência externa.
