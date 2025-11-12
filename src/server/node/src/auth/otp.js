import nodemailer from 'nodemailer';
import { createHash, randomBytes } from 'node:crypto';

// In-memory OTP storage (for development - use Redis/BDO for production)
const otpStore = new Map();
const OTP_EXPIRY = 10 * 60 * 1000; // 10 minutes

// Minnie SMTP configuration
const createEmailTransporter = () => {
  const minnieHost = process.env.MINNIE_HOST || 'localhost';
  const minniePort = process.env.MINNIE_PORT || 2525;

  return nodemailer.createTransport({
    host: minnieHost,
    port: minniePort,
    secure: false, // Minnie doesn't use TLS
    tls: {
      rejectUnauthorized: false
    }
  });
};

// Generate 6-digit OTP code
const generateOTP = () => {
  const code = randomBytes(3).readUIntBE(0, 3) % 1000000;
  return code.toString().padStart(6, '0');
};

// Send OTP via email
export const sendOTP = async (email) => {
  try {
    // Generate OTP
    const otp = generateOTP();
    const expiresAt = Date.now() + OTP_EXPIRY;

    // Store OTP with expiry
    const emailHash = createHash('sha256').update(email.toLowerCase()).digest('hex');
    otpStore.set(emailHash, { otp, expiresAt });

    // Send email via Minnie
    const transporter = createEmailTransporter();

    await transporter.sendMail({
      from: '"Joan Auth" <noreply@planetnine.app>',
      to: email,
      subject: 'Your Login Code',
      text: `Your verification code is: ${otp}\\n\\nThis code will expire in 10 minutes.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #9b59b6;">Your Login Code</h2>
          <p>Enter this code to sign in:</p>
          <div style="background: #f4f4f4; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 8px; margin: 20px 0;">
            ${otp}
          </div>
          <p style="color: #666; font-size: 14px;">This code will expire in 10 minutes.</p>
          <p style="color: #666; font-size: 12px; margin-top: 30px;">
            If you didn't request this code, you can safely ignore this email.
          </p>
        </div>
      `
    });

    console.log(`OTP sent to ${email}: ${otp}`); // For dev - remove in production

    return { success: true, emailHash };
  } catch (error) {
    console.error('Error sending OTP:', error);
    throw error;
  }
};

// Verify OTP code
export const verifyOTP = (email, code) => {
  try {
    const emailHash = createHash('sha256').update(email.toLowerCase()).digest('hex');
    const storedData = otpStore.get(emailHash);

    if (!storedData) {
      return { valid: false, error: 'No OTP found for this email' };
    }

    // Check expiry
    if (Date.now() > storedData.expiresAt) {
      otpStore.delete(emailHash);
      return { valid: false, error: 'OTP expired' };
    }

    // Verify code
    if (storedData.otp !== code) {
      return { valid: false, error: 'Invalid OTP code' };
    }

    // Clean up used OTP
    otpStore.delete(emailHash);

    return { valid: true, emailHash };
  } catch (error) {
    console.error('Error verifying OTP:', error);
    return { valid: false, error: 'Verification failed' };
  }
};

// Clean up expired OTPs periodically
setInterval(() => {
  const now = Date.now();
  for (const [emailHash, data] of otpStore.entries()) {
    if (now > data.expiresAt) {
      otpStore.delete(emailHash);
    }
  }
}, 60000); // Clean up every minute

export default { sendOTP, verifyOTP };
