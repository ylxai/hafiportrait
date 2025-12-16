# 🔐 INSTRUKSI LOGIN ADMIN BARU

## Kredensial Login Baru

Sistem autentikasi sekarang menggunakan **username** bukan email.

### Admin Credentials
```
URL: http://localhost:3000/admin/login
Username: nandika
Password: Hantu@112233
```

## Cara Login

1. **Buka halaman login**: http://localhost:3000/admin/login
2. **Masukkan username**: `nandika` (bukan email)
3. **Masukkan password**: `Hantu@112233`
4. **Klik tombol Login**
5. **Anda akan diarahkan ke**: http://localhost:3000/admin/dashboard

## Perubahan Penting

### ❌ Login Lama (TIDAK BERLAKU LAGI)
- Field: Email
- Value: admin@hafiportrait.com
- Status: User ini sudah dihapus

### ✅ Login Baru (AKTIF)
- Field: Username
- Value: nandika
- Status: Active Admin

## Security Password Requirements

Password "Hantu@112233" memenuhi semua persyaratan keamanan:
- ✅ Minimal 12 karakter
- ✅ Mengandung huruf besar (H)
- ✅ Mengandung huruf kecil (antu)
- ✅ Mengandung angka (112233)
- ✅ Mengandung karakter spesial (@)

## Troubleshooting

### Jika login gagal:

1. **Pastikan menggunakan USERNAME bukan EMAIL**
   - ❌ Salah: admin@hafiportrait.com
   - ✅ Benar: nandika

2. **Pastikan password exact match (case-sensitive)**
   - Password: `Hantu@112233`
   - Perhatikan huruf besar H

3. **Clear browser cookies jika ada session lama**
   ```javascript
   // Di browser console:
   document.cookie.split(";").forEach(c => {
     document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
   });
   ```

4. **Check server status**
   ```bash
   curl http://localhost:3000/api/health
   ```

5. **Restart development server**
   ```bash
   npm run dev
   ```

## Testing dari Command Line

### Test Login API
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"nandika","password":"Hantu@112233"}'
```

### Expected Response
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "cmj5rqb850000l4b75oies8e9",
      "username": "nandika",
      "email": "nandika@hafiportrait.com",
      "name": "Nandika",
      "role": "ADMIN"
    },
    "token": "eyJhbGci..."
  }
}
```

## Migration Notes

### Data yang Di-Transfer
- 6 events dari admin lama sudah di-transfer ke admin baru
- Semua photos, comments, dan data lainnya tetap intact
- History dan timestamps dipertahankan

### Backward Compatibility
- Email field masih ada di database
- Client users (non-admin) masih bisa menggunakan email untuk registration
- JWT tokens lama masih bisa diverifikasi untuk grace period

## Support

Jika ada masalah dengan login:

1. Check file `IMPLEMENTATION_SUMMARY_USERNAME_AUTH.md` untuk detail teknis
2. Verify database dengan:
   ```sql
   SELECT username, email, name, role FROM users WHERE username = 'nandika';
   ```
3. Check application logs untuk error messages
4. Verify Prisma Client sudah ter-generate dengan benar

---

**Last Updated**: 2025-12-14
**Status**: ✅ READY FOR USE
