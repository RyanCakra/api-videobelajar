import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

// Check if necessary environment variables are set
if (!process.env.EMAIL_SERVER || !process.env.EMAIL_SERVER_PASS) {
  throw new Error('Missing EMAIL_SERVER or EMAIL_SERVER_PASS in environment variables');
}

// Create nodemailer transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_SERVER,
    pass: process.env.EMAIL_SERVER_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

// Function to send verification email
const sendVerificationEmail = async (email, verificationLink) => {
  const mailOptions = {
    from: `"Educourse" <${process.env.EMAIL_SERVER}>`,
    to: email,
    subject: 'Account Verification',
    html: `
      <p>Please verify your email by clicking the link below:</p>
      <a href="${verificationLink}">Verify Email</a>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Verification email sent to:', email);
    console.log('Response:', info.response);
  } catch (error) {
    console.error('Error sending verification email:', error.message);
  }
};

export default sendVerificationEmail;

// Example usage (optional, remove if this is just a module)
// sendVerificationEmail('educourse.txt@gmail.com', 'http://localhost:8080/verify/1234567890');
