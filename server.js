require('dotenv').config();
const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(cors({
  origin: true, // Allow all origins in development
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Email configuration
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

// Routes
app.get('/', (req, res) => {
  res.json({
    message: 'Email Server Running',
    status: 'OK',
    email: transporter ? 'Configured ✅' : 'Not configured ⚠️'
  });
});

// Contact form endpoint
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

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('❌ Error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
});

// Start server
app.listen(PORT, () => {
  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`✅ SERVER RUNNING ON http://localhost:${PORT}`);
  console.log(`📧 Contact endpoint: http://localhost:${PORT}/api/contact`);
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
