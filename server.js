require('dotenv').config();
const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(cors({
  origin: true, // Allow all origins in development
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
app.use('/uploads', express.static('uploads'));

// ======================
// EMAIL CONFIGURATION (KEEP AS IS)
// ======================
let transporter = null;

if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
  transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    },
    tls: {
      rejectUnauthorized: false
    }
  });

  transporter.verify((error, success) => {
    if (error) {
      console.error('❌ Email configuration error:', error.message);
      transporter = null;
    } else {
      console.log('✅ Email transporter ready');
    }
  });
} else {
  console.warn('⚠️  Email credentials not found in .env file');
}

// ======================
// MONGODB CONFIGURATION
// ======================
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/rakshak_morcha', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('✅ MongoDB connected');
}).catch(err => {
  console.warn('⚠️  MongoDB connection failed:', err.message);
  console.warn('💡 Using in-memory storage instead');
});

// ======================
// MODELS
// ======================
const mediaSchema = new mongoose.Schema({
  filename: { type: String, required: true },
  url: { type: String, required: true },
  type: { type: String, enum: ['image', 'video'], required: true },
  size: Number,
  createdAt: { type: Date, default: Date.now }
});

const socialWorkSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  media: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Media' }],
  createdAt: { type: Date, default: Date.now }
});

const Media = mongoose.models.Media || mongoose.model('Media', mediaSchema);
const SocialWork = mongoose.models.SocialWork || mongoose.model('SocialWork', socialWorkSchema);

// In-memory storage fallback
let inMemoryMedia = [];
let inMemorySocialWorks = [];

// ======================
// FILE UPLOAD CONFIGURATION
// ======================
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|mp4|mov|avi|webm/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only images and videos are allowed'));
    }
  }
});

// ======================
// AUTHENTICATION MIDDLEWARE
// ======================
const authenticateAdmin = (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret');
    req.adminId = decoded.adminId;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
};

// ======================
// ROUTES
// ======================

// Health check
app.get('/', (req, res) => {
  res.json({
    message: 'Rakshak Morcha Server Running',
    status: 'OK',
    email: transporter ? 'Configured ✅' : 'Not configured ⚠️',
    database: mongoose.connection.readyState === 1 ? 'Connected ✅' : 'Not connected ⚠️'
  });
});

// ======================
// CONTACT FORM ENDPOINT (KEEP AS IS)
// ======================
app.post('/api/contact', async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    // Validate
    if (!name || !email || !subject || !message) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    // Trim
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const trimmedSubject = subject.trim();
    const trimmedMessage = message.trim();

    if (!trimmedName || !trimmedEmail || !trimmedSubject || !trimmedMessage) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }

    // Send email
    let emailSent = false;
    if (transporter && process.env.EMAIL_USER) {
      try {
        await transporter.sendMail({
          from: `"Rakshak Morcha" <${process.env.EMAIL_USER}>`,
          to: process.env.EMAIL_USER,
          replyTo: trimmedEmail,
          subject: `Contact Form: ${trimmedSubject}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #333; border-bottom: 2px solid #333; padding-bottom: 10px;">
                New Contact Form Submission
              </h2>
              <div style="background: #f9f9f9; padding: 20px; border-radius: 5px; margin: 20px 0;">
                <p><strong>Name:</strong> ${trimmedName}</p>
                <p><strong>Email:</strong> ${trimmedEmail}</p>
                <p><strong>Subject:</strong> ${trimmedSubject}</p>
              </div>
              <div style="background: #fff; padding: 20px; border-left: 4px solid #333; margin: 20px 0;">
                <h3>Message:</h3>
                <p style="line-height: 1.6;">${trimmedMessage.replace(/\n/g, '<br>')}</p>
              </div>
            </div>
          `,
          text: `
New Contact Form Submission

Name: ${trimmedName}
Email: ${trimmedEmail}
Subject: ${trimmedSubject}

Message:
${trimmedMessage}
          `
        });

        emailSent = true;
        console.log('✅ Email sent successfully');
        console.log(`   From: ${trimmedEmail}`);
        console.log(`   Subject: ${trimmedSubject}`);
      } catch (err) {
        console.error('❌ Email sending failed:', err.message);
        emailSent = false;
      }
    } else {
      console.warn('⚠️  Email transporter not available');
      emailSent = false;
    }

    res.json({
      success: true,
      message: emailSent ? 'Message sent successfully!' : 'Message received (email unavailable)'
    });

  } catch (error) {
    console.error('❌ Server error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error. Please try again later.'
    });
  }
});

// ======================
// ADMIN AUTHENTICATION ROUTES
// ======================

// Admin Login
app.post('/api/admin/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Check credentials (simple check, can be enhanced with database)
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@rakshakmorcha.org';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

    if (email === adminEmail && password === adminPassword) {
      const token = jwt.sign(
        { adminId: 'admin', email: adminEmail },
        process.env.JWT_SECRET || 'default-secret',
        { expiresIn: '24h' }
      );

      return res.json({
        success: true,
        token,
        message: 'Login successful'
      });
    } else {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }
  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
});

// Verify Token
app.get('/api/admin/verify', authenticateAdmin, (req, res) => {
  res.json({
    success: true,
    message: 'Token is valid'
  });
});

// ======================
// MEDIA ROUTES
// ======================

// Get all media (public)
app.get('/api/media', async (req, res) => {
  try {
    let media = [];
    
    if (mongoose.connection.readyState === 1) {
      media = await Media.find().sort({ createdAt: -1 });
    } else {
      media = inMemoryMedia;
    }

    res.json({
      success: true,
      media: media.map(item => ({
        _id: item._id || item.id,
        filename: item.filename,
        url: item.url,
        type: item.type,
        createdAt: item.createdAt
      }))
    });
  } catch (error) {
    console.error('❌ Error fetching media:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching media'
    });
  }
});

// Upload media (admin only)
app.post('/api/admin/upload', authenticateAdmin, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const fileType = req.file.mimetype.startsWith('image/') ? 'image' : 'video';
    const fileUrl = `/uploads/${req.file.filename}`;

    const mediaData = {
      filename: req.file.originalname,
      url: fileUrl,
      type: fileType,
      size: req.file.size,
      createdAt: new Date()
    };

    let savedMedia;
    
    if (mongoose.connection.readyState === 1) {
      savedMedia = await Media.create(mediaData);
    } else {
      mediaData._id = Date.now().toString();
      inMemoryMedia.push(mediaData);
      savedMedia = mediaData;
    }

    res.json({
      success: true,
      message: 'File uploaded successfully',
      media: savedMedia
    });
  } catch (error) {
    console.error('❌ Upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading file'
    });
  }
});

// Delete media (admin only)
app.delete('/api/admin/media/:id', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    let media;
    
    if (mongoose.connection.readyState === 1) {
      media = await Media.findById(id);
      if (media) {
        // Delete file from filesystem
        const filePath = path.join(__dirname, media.url);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
        await Media.findByIdAndDelete(id);
      }
    } else {
      media = inMemoryMedia.find(m => (m._id || m.id) === id);
      if (media) {
        const filePath = path.join(__dirname, media.url);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
        inMemoryMedia = inMemoryMedia.filter(m => (m._id || m.id) !== id);
      }
    }

    if (!media) {
      return res.status(404).json({
        success: false,
        message: 'Media not found'
      });
    }

    res.json({
      success: true,
      message: 'Media deleted successfully'
    });
  } catch (error) {
    console.error('❌ Delete error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting media'
    });
  }
});

// ======================
// SOCIAL WORKS ROUTES
// ======================

// Get all social works (public)
app.get('/api/social-works', async (req, res) => {
  try {
    let socialWorks = [];
    
    if (mongoose.connection.readyState === 1) {
      socialWorks = await SocialWork.find().populate('media').sort({ createdAt: -1 });
    } else {
      socialWorks = inMemorySocialWorks.map(sw => ({
        ...sw,
        media: sw.mediaIds.map(mediaId => 
          inMemoryMedia.find(m => (m._id || m.id) === mediaId)
        ).filter(Boolean)
      }));
    }

    res.json({
      success: true,
      socialWorks
    });
  } catch (error) {
    console.error('❌ Error fetching social works:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching social works'
    });
  }
});

// Create social work (admin only)
app.post('/api/admin/social-works', authenticateAdmin, async (req, res) => {
  try {
    const { title, description, mediaIds } = req.body;

    if (!title || !description) {
      return res.status(400).json({
        success: false,
        message: 'Title and description are required'
      });
    }

    const socialWorkData = {
      title,
      description,
      media: mediaIds || [],
      createdAt: new Date()
    };

    let savedSocialWork;
    
    if (mongoose.connection.readyState === 1) {
      savedSocialWork = await SocialWork.create(socialWorkData);
      await savedSocialWork.populate('media');
    } else {
      socialWorkData._id = Date.now().toString();
      socialWorkData.mediaIds = mediaIds || [];
      inMemorySocialWorks.push(socialWorkData);
      savedSocialWork = {
        ...socialWorkData,
        media: (mediaIds || []).map(mediaId => 
          inMemoryMedia.find(m => (m._id || m.id) === mediaId)
        ).filter(Boolean)
      };
    }

    res.json({
      success: true,
      message: 'Social work created successfully',
      socialWork: savedSocialWork
    });
  } catch (error) {
    console.error('❌ Error creating social work:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating social work'
    });
  }
});

// Delete social work (admin only)
app.delete('/api/admin/social-works/:id', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    let socialWork;
    
    if (mongoose.connection.readyState === 1) {
      socialWork = await SocialWork.findByIdAndDelete(id);
    } else {
      const index = inMemorySocialWorks.findIndex(sw => (sw._id || sw.id) === id);
      if (index !== -1) {
        socialWork = inMemorySocialWorks[index];
        inMemorySocialWorks.splice(index, 1);
      }
    }

    if (!socialWork) {
      return res.status(404).json({
        success: false,
        message: 'Social work not found'
      });
    }

    res.json({
      success: true,
      message: 'Social work deleted successfully'
    });
  } catch (error) {
    console.error('❌ Error deleting social work:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting social work'
    });
  }
});

// ======================
// ERROR HANDLING
// ======================

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Error handler
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File size too large. Maximum size is 50MB'
      });
    }
  }
  
  console.error('❌ Error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
});

// ======================
// START SERVER
// ======================
app.listen(PORT, () => {
  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`✅ SERVER RUNNING ON http://localhost:${PORT}`);
  console.log(`📧 Contact endpoint: http://localhost:${PORT}/api/contact`);
  console.log(`🔐 Admin endpoint: http://localhost:${PORT}/api/admin/login`);
  console.log(`🔗 Health check: http://localhost:${PORT}/`);
  if (!transporter) {
    console.log('⚠️  Email not configured - Check .env file');
  }
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  console.log('⚠️  KEEP THIS TERMINAL OPEN!');
  console.log('⚠️  Press Ctrl+C to stop the server');
  console.log('');
});
