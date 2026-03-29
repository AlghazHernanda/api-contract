# React Frontend for Auth API

Frontend React dengan Vite untuk API authentication (/login, /register, /profile).

## Fitur

- ✅ **React 17** dengan Vite untuk development cepat
- ✅ **React Router** untuk navigasi antar halaman
- ✅ **Authentication Context** untuk state management global
- ✅ **Form Validation** dengan error handling
- ✅ **Responsive Design** dengan CSS modern
- ✅ **API Integration** dengan backend authentication
- ✅ **Protected Routes** untuk halaman profil
- ✅ **Auto-redirect** berdasarkan status login

## Struktur Project

```
frontend-react/
├── src/
│   ├── components/          # React components
│   │   ├── Home.jsx        # Halaman utama
│   │   ├── Login.jsx       # Form login
│   │   ├── Register.jsx    # Form registrasi
│   │   └── Profile.jsx     # Halaman profil
│   ├── contexts/           # React contexts
│   │   └── AuthContext.jsx # Authentication state
│   ├── services/           # API services
│   │   └── authService.js  # Authentication API calls
│   ├── App.jsx             # Main app component
│   ├── main.jsx            # Entry point
│   └── index.css           # Global styles
├── index.html              # HTML template
├── package.json            # Dependencies
├── vite.config.js          # Vite configuration
└── README.md               # This file
```

## Cara Menjalankan

### Prasyarat

- Node.js v16+ (sudah kompatibel dengan versi Anda)
- Backend API berjalan di http://localhost:3000

### Langkah 1: Install Dependencies

```bash
cd frontend-react
npm install
```

### Langkah 2: Jalankan Development Server

```bash
npm run dev
```

### Langkah 3: Buka di Browser

Frontend akan berjalan di: http://localhost:5173

## API Integration

Frontend terintegrasi dengan backend API endpoints:

- `POST /api/auth/register` - Registrasi user baru
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get user profile (protected)

## Fitur Authentication

### State Management

- Menggunakan React Context untuk global state
- Token disimpan di localStorage
- Auto-check authentication status saat load

### Protected Routes

- Halaman profil hanya bisa diakses setelah login
- Auto-redirect ke login jika belum authenticated
- Auto-redirect ke profil jika sudah login

### Form Validation

- Real-time validation untuk semua input
- Error messages yang user-friendly
- Password strength validation

## Komponen

### Home Component

- Landing page dengan informasi API
- Dynamic content berdasarkan authentication status
- Navigation buttons yang sesuai

### Login Component

- Form login dengan email dan password
- Error handling untuk invalid credentials
- Auto-redirect setelah successful login

### Register Component

- Form registrasi lengkap dengan validasi:
  - Username: 3-50 karakter, alphanumeric
  - Email: Valid email format
  - Phone: 10-15 digits
  - Password: Minimal 6 karakter dengan uppercase, lowercase, dan angka
- Real-time validation feedback

### Profile Component

- Display user information
- Protected route dengan authentication check
- Logout functionality

## Styling

- Responsive design untuk mobile dan desktop
- Modern CSS dengan flexbox dan grid
- Smooth transitions dan hover effects
- Loading states dan error handling

## Development

### Hot Module Replacement

Vite menyediakan HMR untuk development experience yang cepat.

### Proxy Configuration

API requests di-proxy ke backend server (http://localhost:3000) untuk menghindari CORS issues.

### Build untuk Production

```bash
npm run build
```

## Troubleshooting

### CORS Error

Pastikan backend server berjalan dan Vite proxy configuration benar.

### Module Resolution Error

Pastikan semua dependencies terinstall dengan `npm install`.

### Authentication Issues

Check browser localStorage untuk token dan console untuk error messages.
