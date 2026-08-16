# Vessel API Crawler

## Menjalankan aplikasi

Install dependency lalu jalankan satu command:

```bash
npm install
npm start
```

Command tersebut hanya mengambil posisi kapal MMSI `525901342` dari VesselAPI setiap 6 jam.

Untuk menjalankan satu job saja:

```bash
npm run start:tracking
npm run start:lancar
npm run start:stock
npm run start:ports
npm run start:all
```

Atau langsung menggunakan entrypoint:

```bash
node src/app.js tracking
node src/app.js stock
node src/app.js ports
```

Salin `.env.example` menjadi `.env` dan isi konfigurasi sebelum menjalankan job yang memanggil API eksternal. File legacy tetap dipertahankan untuk kompatibilitas sementara.

## VesselAPI tracking

Job tracking menggunakan endpoint posisi VesselAPI dan hanya mengambil MMSI `525901342` setiap 6 jam. Isi `VESSELAPI_API_KEY` di `.env`; interval dan MMSI dapat diubah melalui environment variable.

## KM. Lancar Berkat Prima GPS

Job `lancar` mengambil posisi terakhir KM. Lancar Berkat Prima dari partner GPS API setiap 6 jam dan menyimpannya ke tabel GPS yang sama. Isi `LANCAR_GPS_API_KEY` di `.env`; URL, ESN, dan interval dapat dioverride melalui environment variable.

## Build executable

```bash
npm run build
npm run build:ports
```
