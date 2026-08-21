# Job Monitoring dengan SQLite dan HTML Dashboard

## Tujuan

Menyediakan monitoring lokal untuk seluruh generator/job agar setiap fase eksekusi terlihat, termasuk status berhasil, error, pesan error, durasi, dan waktu kejadian.

## Cakupan job

Monitoring mencakup:

- `vessel-api-tracking`
- `lancar-berkat-prima-gps`
- `stock-broadcast`
- `port-generator`

Job periodik membuat run baru pada setiap siklus. Job sekali jalan juga membuat satu run.

## Arsitektur

Modul monitor SQLite menjadi dependency opsional bagi job. Database disimpan di `data/monitor.sqlite` dan dibuat otomatis. Kegagalan menulis monitoring tidak boleh menghentikan job utama.

HTTP server menggunakan modul `http` bawaan Node sehingga tidak menambah framework web. Server menyajikan `index.html` dan endpoint JSON untuk dashboard.

Command baru:

```text
npm run monitor
```

Default server: `http://localhost:3000`. Port dan lokasi database dapat dikonfigurasi melalui environment variable.

## Model data

Tabel `job_runs` menyimpan satu baris per eksekusi job:

- `id`
- `job_name`
- `status`: `running`, `success`, atau `error`
- `started_at`
- `finished_at`
- `duration_ms`
- `message`
- `error_message`
- `details_json`

Histori lebih dari 30 hari dibersihkan saat server atau pencatatan event berjalan.

## Fase monitoring

Setiap job mencatat event minimal berikut:

1. `running`: job mulai, dengan detail konfigurasi aman dan tidak menyimpan credential.
2. `phase`: fase internal dimulai, misalnya `database-check`, `fetch-vessel-position`, `fetch-vessel-information`, `fetch-telkomsat`, `save-position`, `generate-port-data`, atau `broadcast-stock`.
3. `phase success`: fase selesai, dengan ringkasan jumlah data/record dan durasi.
4. `phase error`: fase gagal, dengan pesan error dan identifier yang relevan bila tersedia.
5. `success` atau `error`: status akhir run beserta ringkasan.

Fase tidak boleh menyimpan API key, token, cookie, atau response mentah yang mungkin berisi credential.

## Dashboard

Halaman HTML menampilkan:

- kartu status terakhir untuk setiap job;
- status `running`, `success`, atau `error`;
- waktu mulai, selesai, durasi, dan pesan ringkas;
- tabel fase terbaru per job;
- histori error terbaru;
- refresh otomatis setiap 10 detik.

Endpoint yang disediakan:

- `GET /` untuk HTML dashboard;
- `GET /api/jobs` untuk status terakhir per job;
- `GET /api/runs?limit=100` untuk histori run dan fase;
- `GET /api/health` untuk pemeriksaan server/database.

## Error handling

Error pada satu fase dicatat lalu diteruskan ke alur error job yang sudah ada. Untuk job yang memang mengisolasi error per kapal atau per sumber API, fase tersebut berstatus error tetapi run dapat tetap berstatus `success` dengan detail `partial_success` jika sebagian proses berhasil.

## Pengujian

- Unit test store untuk membuat run, mencatat fase, menyelesaikan run, dan mengambil status.
- Unit test endpoint JSON tanpa memerlukan browser.
- Test job memastikan event fase penting tercatat dan error tidak mengubah perilaku job utama.
- Verifikasi manual dashboard melalui `npm run monitor`.
