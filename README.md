# Vercel List

Dashboard TypeScript/Next.js untuk menampilkan repository GitHub dan project/deployment Vercel dalam satu tempat.

## Fitur
- Semua repository yang dapat diakses token GitHub.
- Project Vercel dan status deployment terakhir.
- Pencarian repository.
- Statistik jumlah repo, deployment, dan GitHub stars/rating.
- Tombol langsung ke repository dan website deployment.
- Notifikasi dasar ketika deployment Vercel tidak punya repository GitHub yang cocok.
- Responsive desktop/mobile.
- Tanpa database untuk versi awal.

## Environment
Set:
- GITHUB_TOKEN: GitHub Personal Access Token dengan akses read repository yang dibutuhkan.
- VERCEL_TOKEN: Vercel token.
- VERCEL_TEAM_ID: isi hanya jika memakai team Vercel.

## Catatan penting
GitHub stars ditampilkan sebagai "rating" karena itu metrik penilaian/popularitas yang tersedia dari API GitHub. Website tidak bisa menjamin semua deployment dapat di-embed bersamaan: banyak website memblokir iframe melalui security headers. Dashboard menyediakan tombol "Lihat website" untuk setiap deployment.

Untuk notifikasi historis "repo baru / repo dihapus / deployment baru" yang benar-benar persisten, versi berikutnya sebaiknya memakai database + scheduled sync/webhook. Versi ini sudah menjadi fondasi UI dan sinkronisasi live.
