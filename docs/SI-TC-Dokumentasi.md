# SI-TC
## Dokumentasi Produk dan Teknis

Panduan untuk operator survei dan pengembang

Edisi 1.0 | 20 November 2026

---

## 1. Ringkasan

SI-TC adalah aplikasi pencacahan lalu lintas untuk membantu surveyor mencatat volume kendaraan pada survei **ruas jalan** maupun **simpang**. Aplikasi berjalan sebagai web app Next.js dan dapat dibungkus menjadi aplikasi Android menggunakan Capacitor.

Dokumen ini menjelaskan penggunaan aplikasi, cara kerja data, struktur kode, proses pengembangan, dan prosedur membangun Android. Bagian operasional ditulis untuk surveyor; bagian teknis ditujukan untuk engineer yang akan memelihara proyek.

### Tujuan aplikasi

- Mencatat jumlah kendaraan per jenis kendaraan dan interval waktu.
- Mendukung pencacahan ruas jalan serta pencacahan pergerakan kendaraan di simpang.
- Menyimpan sesi dan riwayat secara lokal pada perangkat.
- Menampilkan rekap dan menghasilkan file Excel (`.xlsx`) untuk dibagikan atau disimpan.

### Batasan penting

- Tidak ada backend, akun pengguna, atau sinkronisasi cloud yang dikonfigurasi.
- Data sesi dan riwayat disimpan di penyimpanan lokal aplikasi/browser.
- Ekspor aplikasi Android membuka menu berbagi Android. Pengguna tetap perlu memilih tujuan penyimpanan, misalnya Files atau Drive.
- File PDF ini adalah dokumentasi. Ekspor data survei dari aplikasi menghasilkan XLSX, bukan PDF.

## 2. Panduan operator

### 2.1 Membuat sesi

1. Pilih tipe survei: **Ruas Jalan** atau **Simpang**.
2. Isi nama sesi dan nama petugas/PIC. Keduanya wajib agar tombol **Mulai Survei** aktif.
3. Isi informasi pendukung seperti nama jalan, cuaca, arah arus, tanggal, dan waktu mulai.
4. Pilih interval pencacahan: 5, 10, 15, 30, atau 60 menit.
5. Atur lokasi pencacahan dan kategori kendaraan jika konfigurasi awal belum sesuai.
6. Tekan **Mulai Survei**.

Maksimal ada delapan lokasi pencacahan dalam satu sesi. Untuk survei simpang, setiap lokasi dapat diberi nama dan pendekat. Untuk survei ruas, setiap lokasi menjadi tab yang dipilih saat menghitung.

Kategori bawaan tipe simpang mencakup kendaraan tidak bermotor/pejalan kaki, sepeda motor, mobil penumpang, kendaraan sedang/berat, dan angkutan umum. Tipe ruas menyediakan kategori roda dua, roda empat, angkutan umum, kendaraan berat, dan lain-lain. Nama, singkatan, ikon, kategori, dan kendaraan dapat disesuaikan sebelum sesi dimulai.

### 2.2 Memilih tipe survei

**Simpang**

- Setiap kendaraan dicatat menurut arah **Kiri**, **Lurus**, atau **Kanan**.
- Layar menampilkan kelompok hitung untuk semua simpang yang dikonfigurasi.
- Angka setiap arah dijumlahkan untuk total kendaraan.

**Ruas Jalan**

- Pilih tab ruas yang aktif.
- Setiap ketukan pada kendaraan menambah jumlah kendaraan tersebut satu kali.
- Pada browser dengan keyboard, tombol angka 1 sampai jumlah kendaraan dapat digunakan sebagai jalan pintas. Backspace atau Delete menjalankan Undo.

### 2.3 Menghitung, mengurangi, dan membatalkan

- Ketuk tombol kendaraan atau arah untuk menambah satu.
- Ketuk tombol minus untuk mengurangi satu. Nilai tidak turun di bawah nol.
- **Undo** membatalkan satu tindakan hitung/kurangi terakhir yang tercatat.
- Jika jari digeser untuk menggulir daftar, aplikasi tidak seharusnya mencatat kendaraan; hitungan dijalankan pada peristiwa klik.

Pada batas interval, aplikasi menyimpan hitungan interval tersebut, memulai hitungan interval berikutnya, dan mencoba memberikan getaran singkat jika perangkat mendukung vibrasi.

### 2.4 Jeda dan menyelesaikan survei

- **Jeda** menghentikan timer. Tekan **Lanjut** untuk meneruskan sesi.
- Tekan **Selesai**, lalu konfirmasi untuk mengakhiri survei.
- Data interval yang sedang berjalan disimpan ketika sesi dikonfirmasi selesai.
- Setelah selesai, aplikasi menampilkan layar rekap.

Tombol Back fisik Android diblokir pada layar pencacahan agar sesi tidak tertutup tanpa sengaja. Gunakan tombol **Selesai** untuk mengakhiri survei. Di layar selain pencacahan, tekan Back dua kali dalam rentang sekitar dua detik untuk keluar.

### 2.5 Rekap, riwayat, dan ekspor

- Layar rekap menampilkan total per interval, kendaraan, lokasi, dan total keseluruhan.
- Pilih **Export XLSX** untuk membuat file Excel.
- Di Android, pilih aplikasi tujuan pada menu berbagi. File ditulis lebih dahulu ke cache aplikasi, sehingga file perlu disimpan atau dibagikan dari menu tersebut.
- Riwayat menampilkan sesi yang pernah diselesaikan. Pilih satu sesi untuk melihat rekapnya.
- **Sesi Baru** kembali ke konfigurasi awal. Riwayat sesi tidak ikut dihapus.

Workbook berisi satu sheet untuk setiap lokasi dan satu sheet **Dokumentasi**. Sheet simpang memiliki kolom untuk tiga arah kendaraan; sheet ruas memiliki kolom kendaraan. Beberapa bagian profil dan dokumentasi foto merupakan template untuk diisi lebih lanjut di Excel.

## 3. Gambaran teknis

### 3.1 Stack dan runtime

- Next.js 15.3.6 dengan App Router.
- React 19 dan TypeScript.
- Ekspor statis Next.js melalui `output: "export"`; hasil web dibangun ke folder `out`.
- Capacitor 8 untuk menjalankan web app dalam Android WebView.
- Capacitor App untuk tombol Back Android, Filesystem untuk menulis file ekspor ke cache, dan Share untuk membuka menu berbagi.
- SheetJS/XLSX 0.20.3 untuk membuat workbook.

Halaman utama berada di `app/page.tsx` dan merender komponen client `TrafficCounter`. Tidak ada API route atau layanan server aplikasi yang digunakan pada alur survei.

### 3.2 Struktur direktori

```text
app/
  page.tsx                 Halaman utama Next.js
  layout.tsx               Metadata, font, dan kerangka HTML
  globals.css              Tailwind dan stylesheet ikon eksternal

components/traffic-counter/
  TrafficCounter.tsx       State aplikasi, timer, penyimpanan, dan navigasi
  SetupScreen.tsx          Form konfigurasi sesi
  CountingScreen.tsx       Layar pencacahan dan tombol hitung
  RecapScreen.tsx          Rekap, riwayat, dan tombol ekspor
  exportUtils.ts           Penyusunan workbook XLSX dan ekspor platform
  helpers.ts               Waktu, interval, kendaraan, dan total
  types.ts                 Tipe data dan kategori bawaan
  TrafficCounter.module.css Gaya seluruh layar traffic counter

android/                    Proyek native Android Capacitor
assets/                     Sumber ikon dan splash Capacitor
public/                     Aset statis web
out/                        Hasil ekspor statis Next.js
```

### 3.3 Batas tanggung jawab komponen

- `TrafficCounter.tsx` adalah pemilik state utama. Ia memilih layar, menjalankan timer, mengelola hitungan, menyimpan state, dan memanggil utilitas ekspor.
- `SetupScreen.tsx`, `CountingScreen.tsx`, dan `RecapScreen.tsx` berfokus pada tampilan dan meneruskan aksi pengguna melalui props.
- `types.ts` menjelaskan bentuk data; `helpers.ts` berisi fungsi tanpa UI.
- `exportUtils.ts` mengubah data sesi menjadi workbook, lalu memilih cara mengirim file berdasarkan platform.

Pemisahan ini menjaga aturan bisnis di satu tempat dan membatasi komponen layar agar tidak mengelola salinan state sesi sendiri.

## 4. Model data dan alur sesi

### 4.1 Status sesi

- `idle`: sesi belum dimulai.
- `running`: timer berjalan dan hitungan dapat dicatat.
- `paused`: sesi masih aktif, tetapi timer dijeda.
- `done`: survei selesai dan menunggu/berada di layar rekap.

Siklus utama: konfigurasi > mulai > pencacahan (running/paused) > konfirmasi selesai > rekap > sesi baru atau buka riwayat.

### 4.2 Bentuk data

Satu sesi berisi metadata survei, daftar lokasi, kategori kendaraan, waktu berjalan, dan data interval. Secara konseptual, data interval berbentuk:

```text
data
  +-- intersectionId
      +-- intervalIndex
          +-- vehicleId
              +-- angka                 untuk survei ruas
              +-- { left, straight, right } untuk survei simpang
```

`intervalIndex` disimpan mulai dari nol, sedangkan tampilan rekap menamai interval pertama sebagai I-1. Hitungan yang sedang dikumpulkan dipisahkan dari `session.data`; pemisahan ini memudahkan aplikasi menyimpan satu interval pada saat pergantian interval.

Contoh konseptual:

```text
Simpang: data["simpang-a"]["0"]["motor"] = { left: 4, straight: 20, right: 1 }
Ruas:    data["ruas-a"]["0"]["motor"] = 52
```

### 4.3 Penyimpanan lokal

- `traffic_counter_session`: state layar dan sesi yang dapat dipulihkan.
- `traffic_counter_history`: daftar sesi yang telah diselesaikan; disimpan maksimal 50 sesi.
- Saat layar pencacahan aktif, state dijadwalkan untuk disimpan setiap lima detik.
- Ketika aplikasi dibuka kembali, sesi tersimpan dipulihkan jika status layar terakhir adalah pencacahan atau rekap.

Penyimpanan lokal bukan cadangan permanen. Menghapus data aplikasi/browser atau menghapus aplikasi dapat menghilangkan sesi dan riwayat. Ekspor XLSX secara berkala untuk menyimpan salinan di luar perangkat.

## 5. Detail implementasi

### 5.1 Perhitungan interval

Timer menambah `elapsedSeconds` satu kali per detik saat status sesi `running`. Fungsi `getCurrentIntervalIndex` menghitung indeks interval dari waktu berjalan dan durasi interval. Saat indeks berubah, hitungan aktif disalin ke `session.data`, lalu hitungan aktif dikosongkan untuk interval baru.

Durasi jeda tidak ikut menambah waktu berjalan. Timer berhenti ketika sesi dijeda atau layar pencacahan dilepas.

### 5.2 Input sentuh dan scroll

Tombol hitung menggunakan `onClick`, bukan kombinasi `onTouchStart` dan `onMouseDown`. Peramban/WebView membuat klik setelah sentuhan yang berhasil; gerakan yang dikenali sebagai scroll umumnya membatalkan klik. Pola ini mencegah satu sentuhan diproses dua kali dan menjaga scroll tetap dapat digunakan.

### 5.3 Navigasi Back Android

`@capacitor/app` mengirim event `backButton` pada Android. Selama layar `counting`, handler hanya menampilkan pesan bahwa sesi perlu diakhiri melalui tombol **Selesai**. Pada layar lain, handler menampilkan petunjuk setelah tekanan pertama dan memanggil `App.exitApp()` jika tombol ditekan lagi dalam dua detik.

Handler didaftarkan dan dibersihkan mengikuti siklus hidup komponen. Event Back ini khusus Android; navigasi browser web menggunakan perilaku browser biasa.

### 5.4 Ekspor XLSX

1. `exportUtils.ts` membuat workbook dan sheet sesuai jenis survei.
2. Nama file dibersihkan dari karakter yang tidak aman untuk nama file.
3. Pada web, SheetJS meminta browser mengunduh file.
4. Pada Android/iOS, workbook dikodekan menjadi Base64, ditulis ke `Directory.Cache`, lalu URI file dikirim melalui opsi `files` ke Capacitor Share.
5. Error ekspor diteruskan ke layar rekap dan ditampilkan kepada operator; status tombol ekspor dipulihkan melalui `finally`.

SheetJS dipaketkan sebagai dependency, bukan dimuat dari CDN saat runtime. Karena itu pembuatan workbook tidak memerlukan koneksi jaringan pada perangkat setelah aplikasi terpasang.

`app/globals.css` masih mengimpor Remix Icon dari CDN cdnjs. Jika aplikasi harus benar-benar berfungsi tanpa jaringan, evaluasi penghapusan atau pemaketan lokal stylesheet eksternal tersebut. Font Geist dikonfigurasi melalui `next/font/google` dan diunduh saat proses build.

## 6. Menyiapkan lingkungan pengembangan

### Kebutuhan

- Node.js 20 LTS direkomendasikan untuk Next.js 15.
- npm yang disertakan dengan Node.js.
- Android Studio dan Android SDK untuk build/install Android.
- JDK 17 untuk Android Gradle Plugin 8.

Pada Windows PowerShell, gunakan `npm.cmd` dan `npx.cmd` jika eksekusi file PowerShell `npm.ps1`/`npx.ps1` diblokir oleh Execution Policy.

### Instalasi dependency

Jalankan dari root proyek:

```powershell
npm.cmd ci
```

Dependency `xlsx` mengacu pada tarball resmi SheetJS versi 0.20.3. Instalasi pertama memerlukan akses jaringan untuk mengunduh dependency.

### Mode pengembangan web

```powershell
npm.cmd run dev
```

Buka `http://localhost:3000`. Perubahan komponen akan dimuat ulang oleh Next.js.

### Pemeriksaan dan build web

```powershell
.\node_modules\.bin\tsc.cmd --noEmit --pretty false
npm.cmd run build
```

Build menghasilkan situs statis ke `out/`. Proyek tidak memerlukan server Next.js saat dijalankan sebagai aplikasi Capacitor.

## 7. Build dan distribusi Android

### Sinkronisasi aset web dan plugin

Setelah mengubah kode web, jalankan:

```powershell
npm.cmd run build
npx.cmd cap sync android
```

Perintah `cap sync` menyalin `out/` ke aset Android dan memperbarui registrasi plugin native. Folder `android/` pada proyek ini sudah ada; `cap add android` hanya diperlukan ketika membuat platform Android pertama kali.

### Build APK debug

Pastikan Android Studio memakai JDK 17 pada pengaturan **Gradle JDK**, lalu:

```powershell
npx.cmd cap open android
```

Di Android Studio pilih **Build > Build Bundle(s) / APK(s) > Build APK(s)**.

Alternatif melalui terminal:

```powershell
.\android\gradlew.bat -p .\android assembleDebug
```

Hasil debug biasanya berada di:

```text
android/app/build/outputs/apk/debug/app-debug.apk
```

Untuk memasang melalui USB, aktifkan USB debugging dan izin **Install via USB** pada perangkat. Pesan `INSTALL_FAILED_USER_RESTRICTED` berarti perangkat menolak instalasi melalui USB; pengaturan itu dapat dikelola oleh administrator pada perangkat kantor/sekolah.

### Rilis dan nomor versi

Nomor versi Android berada di `android/app/build.gradle`:

- `versionCode`: angka integer yang harus dinaikkan untuk setiap rilis Play Store.
- `versionName`: string versi yang ditampilkan kepada pengguna.

APK debug cocok untuk pengujian. Distribusi Play Store memerlukan build release bertanda tangan (signed AAB/APK) dan keystore yang dijaga aman. Jangan commit keystore atau password signing ke repository.

## 8. Ikon dan splash screen

Sumber branding saat dokumen dibuat berada di folder `assets/`:

```text
icon-only.png
icon-foreground.png
icon-background.png
splash.png
```

Generator `@capacitor/assets` belum terdaftar pada dependency proyek saat dokumen ini dibuat. Jika akan digunakan, instal sebagai dev dependency lalu jalankan generator Android:

```powershell
npm.cmd install --save-dev @capacitor/assets
npx.cmd @capacitor/assets generate --android
npx.cmd cap sync android
```

Mode custom generator mengharapkan layer ikon dan splash dengan ukuran minimum yang didokumentasikan oleh package. Pastikan layer foreground benar-benar memiliki transparansi jika desain memerlukannya. File splash yang ada saat pemeriksaan berukuran 1408 x 3040 px, sedangkan dokumentasi generator custom meminta sumber minimal 2732 x 2732 px; siapkan ulang sumber yang memenuhi kebutuhan generator sebelum menjalankannya.

## 9. Pengujian dan pemeliharaan

- Type-check: `.\node_modules\.bin\tsc.cmd --noEmit --pretty false`.
- Build statis: `npm.cmd run build`.
- Sinkronisasi Android: `npx.cmd cap sync android`.
- Belum ada script test otomatis di `package.json`.
- Build Next.js pada lingkungan pengembangan dapat memberi peringatan ESLint belum terpasang. Tambahkan dan konfigurasi ESLint jika linting ingin menjadi bagian wajib dari pipeline.

Saat mengubah struktur data sesi, periksa juga kompatibilitas data lama pada `localStorage`, tampilan rekap, dan mapping kolom ekspor. Ketika menambah plugin Capacitor, tambahkan dependency versi yang cocok, kemudian jalankan `cap sync android`.

## 10. Troubleshooting

**TypeScript tidak menemukan `globals.css`**

Deklarasi ambient di `global.d.ts` mencakup CSS, SCSS, dan Sass agar import stylesheet dikenali oleh TypeScript. Jangan menghapus file ini tanpa memastikan pemeriksaan TypeScript tetap lolos.

**Ekspor tidak berfungsi di APK**

- Pastikan memakai APK hasil build terbaru setelah `npm.cmd run build` dan `npx.cmd cap sync android`.
- Pilih aplikasi tujuan pada share sheet Android; file tidak otomatis disimpan ke folder Downloads.
- Periksa pesan yang ditampilkan di layar rekap. Error detail juga dicatat di console WebView.
- Pastikan plugin App, Filesystem, Share, dan dependency SheetJS ikut terpasang di build.

**Hitungan bertambah dua atau scroll menambah hitungan**

Pastikan tombol tidak menggabungkan handler sentuh (`onTouchStart`) dan mouse (`onMouseDown`). Gunakan satu handler `onClick` untuk setiap tombol hitung.

**Build Android gagal meminta Java lebih baru**

Gradle Android modern tidak dapat berjalan pada Java 8. Pilih JDK 17 di Android Studio pada pengaturan Gradle JDK, lalu ulangi build.

**Instalasi USB ditolak**

Aktifkan USB debugging dan Install via USB di Opsi Developer perangkat. Jika opsi dikunci oleh kebijakan organisasi, hubungi administrator.

## 11. Referensi kode utama

- `components/traffic-counter/TrafficCounter.tsx`: orkestrasi state dan alur aplikasi.
- `components/traffic-counter/types.ts`: tipe sesi, hitungan, dan kategori bawaan.
- `components/traffic-counter/helpers.ts`: fungsi format waktu dan agregasi jumlah.
- `components/traffic-counter/exportUtils.ts`: pembentukan workbook dan integrasi Capacitor.
- `capacitor.config.ts`: identitas aplikasi native dan folder web hasil build.
- `next.config.ts`: konfigurasi ekspor statis.
- `android/app/build.gradle`: konfigurasi Android dan versi aplikasi.
- `package.json`: dependency, script pengembangan, dan build.

## 12. Glosarium

- **Sesi**: satu rangkaian survei dengan metadata, lokasi, kategori kendaraan, waktu, dan hasil hitung.
- **Simpang**: survei kendaraan yang mengelompokkan setiap kendaraan menurut arah kiri, lurus, dan kanan.
- **Ruas**: survei volume kendaraan pada ruas jalan; hitungan disimpan per kendaraan dan lokasi aktif.
- **Interval**: potongan durasi pengamatan, misalnya 15 menit.
- **Capacitor**: lapisan native yang menjalankan hasil web di Android dan menyediakan plugin perangkat.
- **Static export**: hasil build web berupa file statis di `out/`, tanpa server Next.js untuk merender halaman.
- **Share sheet**: menu Android untuk memilih aplikasi tujuan berbagi atau menyimpan file.
