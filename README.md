# Zerberhobi Market

Zerberhobi Market, tuhafiye, craft ve 3D baskı ürünleri için hazırlanmış modüler bir Next.js mağazasıdır.

## Kurulum

```bash
cp .env.example .env
npm install
npx prisma migrate dev
npm run db:seed
npm run dev
```

Demo hesaplar: `admin@zerberhobi.com / Admin123!` ve `musteri@zerberhobi.com / Musteri123!`.

## Docker

```bash
docker compose up --build
docker compose exec app npx prisma migrate deploy
docker compose exec app npm run db:seed
```

Uygulama `http://localhost:3000`, Nginx geçidi `http://localhost:8080` adresinde çalışır. Üretimde `.env` sırlarını değiştirin ve Nginx TLS sertifika yollarını etkinleştirin.

## Komutlar

- `npm run dev`: geliştirme sunucusu
- `npm run build`: production derlemesi
- `npm run lint`: ESLint
- `npm run db:seed`: örnek katalog ve kullanıcıları yükler
