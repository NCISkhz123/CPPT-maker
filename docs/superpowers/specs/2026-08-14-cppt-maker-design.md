# Spesifikasi Desain: CPPT Maker (AI PCNE)

## 1. Tujuan
Membuat aplikasi web berbasis AI untuk membantu apoteker dalam pengambilan keputusan klinis dan penyusunan *Assessment* (A) serta *Plan* (P) pada CPPT menggunakan metode klasifikasi PCNE.

## 2. Arsitektur & Teknologi
*   **Frontend Framework:** React.js dengan Vite.
*   **Styling & Komponen:** Tailwind CSS & **shadcn/ui** untuk antarmuka yang modern, responsif, dan rapi.
*   **Backend & Database:** Supabase (Autentikasi & PostgreSQL).
*   **Integrasi AI (LLM):** Menggunakan sistem **BYOK (*Bring Your Own Key*)**. *Frontend* akan memanggil API AI (misalnya Gemini) secara langsung menggunakan *API Key* yang dimasukkan oleh pengguna (*user*).

## 3. Fitur Utama & Alur Pengguna
### A. Autentikasi (Supabase Auth)
*   Apoteker harus *Login* atau *Register* sebelum mengakses fitur.
*   Sistem manajemen sesi otomatis menggunakan Supabase.

### B. Pengaturan API Key (BYOK)
*   Halaman khusus bagi apoteker untuk memasukkan *API Key* AI mereka.
*   *API Key* disimpan secara lokal di *browser* (`localStorage`) sehingga aman dan tidak membebani server pusat.

### C. Manajemen Pasien & Riwayat CPPT
*   Menambah profil pasien baru.
*   Melihat rekam medis pasien berupa daftar riwayat CPPT (SOAP) dari hari ke hari yang saling terhubung.

### D. Fitur Utama: CPPT Maker
*   Pengguna memilih pasien, lalu memasukkan data **Subjektif (S)** dan **Objektif (O)** pada hari tersebut.
*   Pengguna menekan tombol "Buat Analisis PCNE".
*   Sistem mengirimkan *prompt* khusus ke AI yang berisi data S dan O, beserta instruksi format PCNE.
*   AI mengembalikan **Assessment (A)** dan **Plan (P)** dengan format yang diwajibkan:
    ```
    [Kode PCNE] - [Deskripsi Point PCNE]
    [Analisis Mendalam / Keterangan]
    ```
    *Contoh:*
    > P2.1 - kejadian obat yang merugikan mungkin terjadi
    > Pasien mengalami efek samping merugikan berupa mual dan pusing yang dicurigai akibat akumulasi Levofloxacin.
*   Pengguna dapat meninjau hasil AI, mengedit teks jika diperlukan, dan menyimpannya.
*   Data S, O, A, P beserta tanggalnya akan disimpan ke *database* Supabase.

## 4. Skema Database (Supabase)
1.  **Tabel `patients`**
    *   `id` (UUID, Primary Key)
    *   `user_id` (UUID, Foreign Key ke tabel Auth)
    *   `nama` (Text)
    *   `no_rm` (Text)
    *   `created_at` (Timestamp)
2.  **Tabel `cppt_records`**
    *   `id` (UUID, Primary Key)
    *   `patient_id` (UUID, Foreign Key ke `patients`)
    *   `user_id` (UUID, Foreign Key ke tabel Auth)
    *   `tanggal` (Date)
    *   `subjective` (Text)
    *   `objective` (Text)
    *   `assessment` (Text)
    *   `plan` (Text)
    *   `created_at` (Timestamp)

## 5. Kebutuhan Referensi Tambahan
*   Menerapkan *library* UI **shadcn/ui** untuk konsistensi desain.
*   *(Catatan Internal: Mengonfirmasi maksud dari referensi `context7` dari pengguna untuk diintegrasikan ke dalam prompt AI atau arsitektur).*
