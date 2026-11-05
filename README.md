# Jangan Buka HP Orang!

Proyek story interaktif mandiri. Folder ini adalah repositori Git tersendiri dan tidak membutuhkan AU Maker, Laravel, PHP, Docker, atau database. Semua HTML, JavaScript, CSS, dan gambar ada di sini.

## Jalankan

Pasang Node.js, lalu dari folder proyek jalankan:

```sh
npm start
```

Buka **http://127.0.0.1:8081/**. Di Windows bisa klik dua kali [JALANKAN-STORY.cmd](JALANKAN-STORY.cmd). Tidak perlu `npm install`; proyek tidak memakai dependency tambahan. Biarkan server berjalan, tekan Ctrl+C untuk berhenti.

## Letak file

| Yang ingin diubah | File |
| --- | --- |
| Kontak, chat, notifikasi, foto, dan catatan cerita | [js/found-phone-story.js](js/found-phone-story.js) |
| Perilaku HP, WhatsApp, Instagram, dan X | [js/found-phone.js](js/found-phone.js) |
| Kalender dan Pengingat | [js/phone-organizer.js](js/phone-organizer.js) |
| Halaman pembuka | [index.html](index.html) |
| Tampilan HP dan WhatsApp | [css/found-phone.css](css/found-phone.css) |
| Tampilan Instagram dan X | [css/phone-social.css](css/phone-social.css) |
| Tampilan Foto dan Catatan | [css/phone-library.css](css/phone-library.css) |
| Tampilan Kalender dan Pengingat | [css/phone-organizer.css](css/phone-organizer.css) |
| Foto, ikon, dan stiker | [images/](images/) |
| Kredit gambar | [credits.html](credits.html) dan berkas SOURCES di folder gambar |
| Server lokal | [serve.mjs](serve.mjs) |

## Pengujian

```sh
npm test
```

Saat server sudah berjalan, cek halaman, aset, kredit, serta batas akses server dengan `npm run check:server`.

## Push ke GitHub

Repo GitHub: [JesslynFelicia/jangan-buka-hp-orang](https://github.com/JesslynFelicia/jangan-buka-hp-orang).

**Mainkan online: [Jangan Buka HP Orang!](https://jesslynfelicia.github.io/jangan-buka-hp-orang/)**

GitHub Pages menerbitkan branch `main` dari folder root. File `.nojekyll` membuat HTML, CSS, JavaScript, dan gambar disajikan langsung. `serve.mjs` hanya untuk preview lokal; hosting tidak membutuhkan Node.js.

Untuk mengirim perubahan berikutnya:

```sh
git add .
git commit -m "Update story"
git push
```

Perubahan yang dipush ke `main` otomatis diterbitkan oleh GitHub Pages setelah deployment selesai.

File AU Maker, database, vendor, dan konfigurasi lingkungannya tidak termasuk di repositori ini. Halaman juga bisa disajikan oleh hosting statis; root situsnya adalah folder ini. HTML memakai JavaScript modules sehingga harus dibuka melalui server.

Isi mengikuti Scene I pada tab [Draft Naskah](https://docs.google.com/document/d/1sT9sCxHnTIbe6a5BH-30O5cSECAbMWOSh3omcPPU2Xw/edit?tab=t.0). Kredit dan lisensi aset tetap tercantum di [credits.html](credits.html) serta berkas SOURCES dalam [images/](images/). Progres tersimpan di browser, terpisah per alamat/port.
