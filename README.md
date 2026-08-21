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

## Monitoring generator

Jalankan dashboard monitoring lokal dengan:

```bash
npm run monitor
```

Buka `http://localhost:3000`. Dashboard menampilkan status dan histori fase untuk tracking kapal, Lancar GPS, broadcast stok, dan generator port, termasuk durasi serta pesan error. Data disimpan di `data/monitor.sqlite` dan histori lebih dari 30 hari dibersihkan otomatis.

Konfigurasi opsional: `MONITOR_HOST`, `MONITOR_PORT`, `MONITOR_DB_PATH`. Untuk menjalankan job tanpa pencatatan monitoring, gunakan `MONITOR_DISABLED=true`.

Salin `.env.example` menjadi `.env` dan isi konfigurasi sebelum menjalankan job yang memanggil API eksternal. File legacy tetap dipertahankan untuk kompatibilitas sementara.

## VesselAPI tracking

Job tracking berjalan setiap 6 jam. Job ini mengambil posisi MMSI dari VesselAPI dan, bila `TELKOMSAT_API_KEY` diisi, mengambil seluruh kapal dari endpoint Telkomsat `my_vessel`. Data Telkomsat dikirim sebagai multipart form dengan field `key`, lalu disimpan ke tabel GPS yang sama. URL Telkomsat dapat diubah melalui `TELKOMSAT_API_URL`.

Isi `VESSELAPI_API_KEY` dan/atau `TELKOMSAT_API_KEY` di `.env`; interval dan MMSI VesselAPI dapat diubah melalui environment variable.

Pada setiap eksekusi, MMSI dari `VESSELAPI_MMSI` dibandingkan dengan `device_gps.id`. MMSI yang belum ada akan diambil informasinya dari endpoint VesselAPI `/v1/vessel/{mmsi}` dan nama kapal disimpan sebagai nilai polos di `device_gps.keterangan`.

## KM. Lancar Berkat Prima GPS

Job `lancar` mengambil posisi terakhir KM. Lancar Berkat Prima dari partner GPS API setiap 6 jam dan menyimpannya ke tabel GPS yang sama. Isi `LANCAR_GPS_API_KEY` di `.env`; URL, ESN, dan interval dapat dioverride melalui environment variable.

## Build executable

```bash
npm run build
npm run build:ports
```
