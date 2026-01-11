# ✅ Admin Dashboard Backend - Complete!

## 🎯 What's Been Added

### ✅ Email Functionality (KEPT INTACT)
- `/api/contact` - Contact form email endpoint (unchanged)
- Email sending works exactly as before ✅

### ✅ Admin Authentication
- `/api/admin/login` - Admin login (returns JWT token)
- `/api/admin/verify` - Verify JWT token

### ✅ Media Management
- `/api/media` - GET - Get all media (public)
- `/api/admin/upload` - POST - Upload media files (admin only)
- `/api/admin/media/:id` - DELETE - Delete media (admin only)

### ✅ Social Works Management
- `/api/social-works` - GET - Get all social works (public)
- `/api/admin/social-works` - POST - Create social work post (admin only)
- `/api/admin/social-works/:id` - DELETE - Delete social work post (admin only)

## 🔐 Admin Credentials

Default admin credentials (set in `.env`):
- **Email:** `admin@rakshakmorcha.org`
- **Password:** `admin123`

**⚠️ IMPORTANT:** Change these in production!

To change, update `.env`:
```
ADMIN_EMAIL=your-email@example.com
ADMIN_PASSWORD=your-secure-password
JWT_SECRET=your-secret-key-change-this
```

## 💾 Database

Uses MongoDB if available, otherwise falls back to in-memory storage.

MongoDB is optional - the app works without it!

To use MongoDB:
1. Install MongoDB locally or use MongoDB Atlas
2. Update `.env`:
   ```
   MONGODB_URI=mongodb://localhost:27017/rakshak_morcha
   ```
   Or for MongoDB Atlas:
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/rakshak_morcha
   ```

## 📁 File Uploads

- Files are stored in `server/uploads/` directory
- Maximum file size: 50MB
- Supported formats: Images (jpeg, jpg, png, gif) and Videos (mp4, mov, avi, webm)
- Files are served at: `http://localhost:8080/uploads/filename`

## 🚀 How to Use

### 1. Start the Server
```bash
cd server
npm start
```

### 2. Login as Admin
- Go to: http://localhost:3000/admin
- Email: `admin@rakshakmorcha.org`
- Password: `admin123`

### 3. Use Admin Dashboard
- Upload photos/videos
- Create social work posts
- Delete media and posts

### 4. Public Pages
- View social works: http://localhost:3000/social-works
- Contact form: http://localhost:3000/contact

## ✅ All Endpoints

### Public Endpoints:
- `GET /` - Health check
- `POST /api/contact` - Contact form (email)
- `GET /api/media` - Get all media
- `GET /api/social-works` - Get all social works

### Admin Endpoints (Require JWT Token):
- `POST /api/admin/login` - Login
- `GET /api/admin/verify` - Verify token
- `POST /api/admin/upload` - Upload file
- `DELETE /api/admin/media/:id` - Delete media
- `POST /api/admin/social-works` - Create post
- `DELETE /api/admin/social-works/:id` - Delete post

## 🔒 Security Notes

1. **Change default admin password** in production
2. **Use strong JWT_SECRET** in production
3. **Keep `.env` file secure** - never commit it to git
4. **File upload validation** - only images/videos allowed
5. **File size limit** - 50MB maximum

## 📋 Dependencies Added

- `jsonwebtoken` - JWT authentication
- `bcryptjs` - Password hashing (ready for future use)
- `mongoose` - MongoDB ODM
- `multer` - File upload handling

## ✅ Email Functionality Status

**✅ FULLY INTACT AND UNCHANGED**
- Contact form endpoint works exactly as before
- Email sending unchanged
- No modifications to email code

---

**Everything is ready! Start the server and test the admin dashboard!** 🚀

