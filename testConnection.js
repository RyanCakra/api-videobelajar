import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

// Load variabel lingkungan dari file .env
dotenv.config();

async function sendMail() {
  // Membuat transporter untuk koneksi ke SMTP Gmail
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com', // Gunakan host server SMTP Gmail
    port: 465, // Port untuk SMTPS (SSL)
    secure: false, // true untuk menggunakan SSL (SMTPS)
    auth: {
      user: 'educourse.txt@gmail.com', // Email pengirim
      pass: 'qubxkfqcutdbnevx', // Kata sandi atau App Password (untuk 2FA)
    },
    tls: {
      rejectUnauthorized: false,
    },
  });

  // Opsi email yang akan dikirim
  const mailOptions = {
    from: `"Email Testing" <educourse.txt@gmail.com>`, // Format nama dan email pengirim
    to: 'emailtesting.txt@gmail.com', // Email penerima
    subject: 'SMTP test from smtp.gmail.com', // Subjek email
    text: 'Test message', // Pesan dalam format plain text
    html: '<b>Test message</b>', // Pesan dalam format HTML
  };

  try {
    // Mengirim email
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent: ' + info.response);
  } catch (error) {
    console.log('Error sending email:', error);
  }
}

// Memanggil fungsi untuk mengirim email
sendMail();
