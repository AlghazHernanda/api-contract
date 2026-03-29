# MariaDB Database Commands

## 📋 Command untuk Melihat Data di MariaDB

### 1. Login ke MariaDB

```cmd
mysql -u root -proot
```

### 2. Lihat Semua Database

```sql
SHOW DATABASES;
```

### 3. Pilih Database auth_api

```sql
USE auth_api;
```

### 4. Lihat Semua Table

```sql
SHOW TABLES;
```

### 5. Lihat Struktur Table users

```sql
DESCRIBE users;
```

### 6. Lihat Semua Data di Table users

```sql
SELECT * FROM users;
```

### 7. Lihat Data Tertentu (by ID)

```sql
SELECT * FROM users WHERE id = 1;
```

### 8. Lihat Data Tertentu (by Email)

```sql
SELECT * FROM users WHERE email = 'test@example.com';
```

### 9. Lihat Data Tanpa Password

```sql
SELECT id, username, email, created_at, updated_at FROM users;
```

### 10. Hitung Jumlah User

```sql
SELECT COUNT(*) as total_users FROM users;
```

## 🚀 One-Liner Commands (Langsung dari CMD)

### Lihat semua user langsung dari CMD:

```cmd
mysql -u root -proot -e "USE auth_api; SELECT id, username, email, created_at FROM users;"
```

### Lihat struktur table langsung dari CMD:

```cmd
mysql -u root -proot -e "USE auth_api; DESCRIBE users;"
```

### Hitung jumlah user langsung dari CMD:

```cmd
mysql -u root -proot -e "USE auth_api; SELECT COUNT(*) as total_users FROM users;"
```

## 🔍 Useful Queries

### Cari user berdasarkan username:

```sql
SELECT * FROM users WHERE username LIKE '%test%';
```

### Lihat user yang dibuat hari ini:

```sql
SELECT * FROM users WHERE DATE(created_at) = CURDATE();
```

### Lihat 5 user terbaru:

```sql
SELECT * FROM users ORDER BY created_at DESC LIMIT 5;
```

## 🛠️ Management Commands

### Hapus user tertentu:

```sql
DELETE FROM users WHERE id = 1;
```

### Update username:

```sql
UPDATE users SET username = 'new_username' WHERE id = 1;
```

### Hapus semua data (HATI-HATI!):

```sql
TRUNCATE TABLE users;
```

### Hapus table (HATI-HATI!):

```sql
DROP TABLE users;
```

### Hapus database (HATI-HATI!):

```sql
DROP DATABASE auth_api;
```

## 📱 Export/Import Database

### Export database ke file:

```cmd
mysqldump -u root -proot auth_api > backup_auth_api.sql
```

### Import dari file:

```cmd
mysql -u root -proot auth_api < backup_auth_api.sql
```

## 💾 Tips Tambahan

### Format output yang lebih bagus:

```sql
SELECT
    id AS 'ID',
    username AS 'Username',
    email AS 'Email',
    created_at AS 'Created Date'
FROM users;
```

### Lihat user dengan format tanggal Indonesia:

```sql
SELECT
    id,
    username,
    email,
    DATE_FORMAT(created_at, '%d-%m-%Y %H:%i:%s') AS 'Tanggal Dibuat'
FROM users;
```

## 🎯 Quick Reference

Copy paste command ini langsung di CMD:

```cmd
# Login dan lihat semua user
mysql -u root -proot -e "USE auth_api; SELECT id, username, email, created_at FROM users;"

# Login dan lihat struktur table
mysql -u root -proot -e "USE auth_api; DESCRIBE users;"

# Login ke MariaDB (interactive mode)
mysql -u root -proot
```

**CATATAN**: Password akan muncul sebagai hash (bcrypt), jadi tidak bisa dibaca langsung. Ini normal untuk keamanan!
