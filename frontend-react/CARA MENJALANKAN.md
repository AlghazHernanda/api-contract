# Cara Menjalankan React Frontend di Browser

## Status Saat Ini ✅

- **Backend API** berjalan di http://localhost:3000
- **React Frontend** berjalan di http://localhost:5173

## Cara Membuka Frontend

### Cara 1: Otomatis (Sudah Berjalan)

1. **React development server sudah berjalan** di terminal
2. Buka browser dan akses: **http://localhost:5173**
3. Frontend akan terbuka dengan tampilan yang sudah diperbaiki

### Cara 2: Manual Jika Server Berhenti

1. Buka Command Prompt atau PowerShell
2. Navigasi ke folder frontend:
   ```bash
   cd "C:\Users\algha\Documents\kumpulan project 2025\api-contract\frontend-react"
   ```
3. Jalankan development server:
   ```bash
   npm run dev
   ```
4. Buka browser dan akses: **http://localhost:5173**

## Fitur yang Tersedia

### 🏠 Halaman Home (http://localhost:5173/)

- Landing page dengan informasi API
- Dynamic content berdasarkan login status
- Navigation buttons yang responsive

### 📝 Halaman Register (http://localhost:5173/register)

- Form registrasi user baru
- Real-time validation untuk semua field
- Password strength indicator
- Mobile-friendly input fields

### 🔐 Halaman Login (http://localhost:5173/login)

- Form login dengan email dan password
- Error handling yang user-friendly
- Auto-redirect setelah login

### 👤 Halaman Profile (http://localhost:5173/profile)

- Protected route (hanya bisa diakses setelah login)
- Display user information
- Logout functionality

## 📱 Responsive Design

### Desktop (> 1200px)

- Navbar full-width dengan spacing optimal
- Cards dengan maximum width untuk readability
- Multi-column layout untuk profile details

### Tablet (768px - 1024px)

- Navbar yang centered dengan horizontal menu
- 2-column grid untuk profile details
- Balanced spacing untuk touch dan mouse

### Mobile (< 768px)

- Navbar dengan logo di atas, menu vertikal di bawah
- Single column layout
- Large tap targets untuk mudah diakses
- Optimized font sizes untuk readability

## 🎨 Fitur Tampilan

### Navbar Biru Full-Width

- Background biru (#4a6de5) dari pojok kiri ke kanan
- Sticky position agar tetap terlihat saat scroll
- Responsive menu yang beradaptasi dengan device

### Form Improvements

- Input fields dengan proper spacing
- Real-time validation feedback
- Focus states untuk accessibility
- Auto-complete attributes

### Interactive Elements

- Button hover effects dengan smooth transitions
- Loading states dengan spinner animation
- Error messages yang clear dan actionable

## 🧪 Testing Flow

### 1. Registrasi User Baru

1. Buka http://localhost:5173/register
2. Isi form dengan data valid:
   - Username: 3-50 karakter, alphanumeric
   - Email: Format email yang valid
   - Phone: 10-15 digits
   - Password: Minimal 6 karakter dengan uppercase, lowercase, dan angka
3. Klik "Register"
4. Setelah berhasil, akan di-redirect ke halaman profile

### 2. Login User

1. Buka http://localhost:5173/login
2. Masukkan email dan password yang sudah terdaftar
3. Klik "Login"
4. Akan di-redirect ke halaman profile

### 3. View Profile

1. Setelah login, buka http://localhost:5173/profile
2. Lihat data user yang ditampilkan
3. Klik "Logout" untuk keluar

## 🔧 Troubleshooting

### Jika Frontend Tidak Bisa Diakses

1. Pastikan development server berjalan:
   ```bash
   cd frontend-react
   npm run dev
   ```
2. Cek port 5173 tidak digunakan oleh aplikasi lain
3. Clear browser cache dengan Ctrl+F5

### Jika API Error

1. Pastikan backend server berjalan di port 3000
2. Cek browser console untuk error messages
3. Verify API endpoints accessible di http://localhost:3000

### Jika CORS Error

1. Pastikan backend dan frontend berjalan
2. Refresh browser dengan Ctrl+F5
3. Coba buka dengan browser berbeda

## 📋 Requirements

### Backend

- ✅ Server berjalan di http://localhost:3000
- ✅ API endpoints: /register, /login, /profile
- ✅ CORS enabled untuk development

### Frontend

- ✅ React 17 dengan Vite
- ✅ React Router untuk navigation
- ✅ Responsive CSS dengan mobile-first approach
- ✅ Authentication state management

## 🚀 Quick Start

1. **Pastikan backend berjalan** (terminal 1)
2. **Pastikan frontend berjalan** (terminal 2)
3. **Buka browser**: http://localhost:5173
4. **Mulai testing**: Register → Login → Profile

Frontend React yang modern dan responsif sudah siap digunakan!
