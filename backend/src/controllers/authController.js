const User = require("../models/User.js");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
const { OAuth2Client } = require("google-auth-library");
const dotenv = require("dotenv").config();
const crypto = require("crypto");

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const generateToken = (user) => {
  return jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });
};

exports.forgotPassword = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      // Don't reveal if email exists (security best practice)
      
      return res.status(200).json({ 
        message: "If an account with that email exists, a reset link has been sent." 
      });
    }

    // Generate secure reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    // Option 1: Simple (for quick testing) - using in-memory (you had this)
    // resetTokens.set(email, { token: hashedToken, expiry: Date.now() + 15 * 60 * 1000 });

    // Option 2: Better - Store in User model (Recommended for now)
    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = Date.now() + 15 * 60 * 1000; // 15 minutes
    await user.save();

    // Create reset link for React frontend (Vite default port 5173)
    const resetLink = `http://localhost:5173/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;

    // Send email
    const mailOptions = {
      from: `"Vibe Meet" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Reset Your Vibe Meet Password",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #7e22ce;">Reset Your Password</h2>
          <p>Hi there,</p>
          <p>You requested to reset your password for Vibe Meet.</p>
          <p>Click the button below to set a new password:</p>
          
          <a href="${resetLink}" 
             style="background: linear-gradient(to right, #7e22ce, #db2777); 
                    color: white; 
                    padding: 14px 28px; 
                    text-decoration: none; 
                    border-radius: 12px; 
                    display: inline-block; 
                    margin: 20px 0;">
            Reset Password
          </a>

          <p style="color: #666; font-size: 14px;">
            This link will expire in 15 minutes.<br>
            If you didn't request this, please ignore this email.
          </p>
          <p>Best regards,<br><strong>Vibe Meet Team</strong> ❤️</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({
      message: "Password reset link sent successfully! Please check your email.",
    });
  } catch (error) {
    console.error("Forgot Password Error:", error);
    res.status(500).json({ message: "Internal server error. Please try again later." });
  }
};

exports.resetPassword = async (req, res) => {
  const { token, email, newPassword } = req.body;

  if (!token || !email || !newPassword) {
    return res.status(400).json({ message: "Token, email, and new password are required" });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ message: "Password must be at least 6 characters long" });
  }

  try {
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      email,
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() }, // Token not expired
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired reset token" });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update user
    user.password = hashedPassword;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;

    await user.save();

    res.status(200).json({
      message: "Password reset successful! You can now login with your new password.",
    });
  } catch (error) {
    console.error("Reset Password Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// POST /api/auth/reset-password-with-current
exports.resetPasswordWithCurrent = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user.id; // from auth middleware

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) return res.status(400).json({ message: "Current password is incorrect" });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.json({ message: "Password updated successfully" });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

// ====================== REGISTER ======================
exports.register = async (req, res) => {
  const { name, username, email, password } = req.body;

  try {
    if (!name || !username || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const existing = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (existing) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    const user = await User.create({
      name,
      username,
      email,
      password: hashedPassword,
      otp,
      otpExpiry,
      isVerified: false,
    });

    await transporter
      .sendMail({
        from: `"VibeMeet Support 💜"<${process.env.EMAIL_USER}>`,
        to: email,
        subject:  'VibeMeet - Verify Your Email',
        html: `
<div style="margin:0; padding:0; background: linear-gradient(135deg, #f1e6f8, #d1e4f4); font-family: 'Poppins', Arial, sans-serif;">
  
  <div style="max-width: 520px; margin: 40px auto; background: #ffffff; border-radius: 20px; padding: 30px; box-shadow: 0 15px 40px rgba(0,0,0,0.1); text-align: center;">
    
    <!-- Logo / Title -->
    <h1 style="margin-bottom: 10px; font-size: 32px; font-weight: 700; background: linear-gradient(to right, #CDB4DB, #FFC8DD); -webkit-background-clip: text; color: transparent;">
      VibeMeet
    </h1>

    <p style="color: #6b7280; font-size: 14px; margin-bottom: 25px;">
      Find your people. Meet in real life.
    </p>

    <!-- Heading -->
    <h2 style="color: #111827; margin-bottom: 10px;">
      Verify Your Email
    </h2>

    <p style="color: #4b5563; font-size: 15px; line-height: 1.6;">
      Welcome to <strong>VibeMeet</strong> 🎉 <br/>
      Use the OTP below to complete your registration.
    </p>

    <!-- OTP Box -->
    <div style="margin: 30px 0;">
      <span style="
        display: inline-block;
        font-size: 34px;
        font-weight: bold;
        letter-spacing: 8px;
        color: #2D2D2D;
        background: linear-gradient(135deg, #F1F0F5, #ffffff);
        padding: 14px 26px;
        border-radius: 12px;
        box-shadow: 0 8px 20px rgba(205, 180, 219, 0.3);
      ">
        ${otp}
      </span>
    </div>

    <!-- Info -->
    <p style="color: #6b7280; font-size: 14px;">
      ⏳ This OTP is valid for <strong>10 minutes</strong>
    </p>

    <p style="color: #9ca3af; font-size: 13px; margin-top: 10px;">
      Do not share this code with anyone.
    </p>

    <!-- Divider -->
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 25px 0;" />

    <!-- Footer -->
    <p style="color: #9ca3af; font-size: 12px;">
      If you didn’t request this, you can safely ignore this email.
    </p>

    <p style="color: #9ca3af; font-size: 12px; margin-top: 10px;">
      © ${new Date().getFullYear()} VibeMeet. All rights reserved.
    </p>

  </div>

</div>
`,
      })
      .catch((err) => {
        console.log("nodemailler error " + err);
      });

    res.status(201).json({
      message: "OTP sent to your email",
      email,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

// ====================== VERIFY OTP ======================
exports.verifyOtp = async (req, res) => {
  const { email, otp } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    if (user.otp !== otp || user.otpExpiry < Date.now()) {
      return res.status(400).json({
        message: "Invalid or expired OTP",
      });
    }

    user.isVerified = true;
    user.otp = undefined;
    user.otpExpiry = undefined;

    await user.save();

    const token = generateToken(user);

    res.json({
      token,
      user: {
        ...user.toObject(),
        password: undefined,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ====================== LOGIN ======================
exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({
        message: "Invalid user",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password || "");

    if (!isMatch) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    if (!user.isVerified) {
      return res.status(401).json({
        message: "Please verify your email first",
      });
    }

    const token = generateToken(user);

    res.json({
      token,
      user: {
        ...user.toObject(),
        password: undefined,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ====================== GOOGLE LOGIN ======================
exports.googleLogin = async (req, res) => {
  const { credential } = req.body;

  try {
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;

    let user = await User.findOne({
      $or: [{ email }, { googleId }],
    });

    if (!user) {
      const username = email.split("@")[0] + Math.floor(Math.random() * 1000);

      user = await User.create({
        name,
        username,
        email,
        googleId,
        avatar: picture,
        isVerified: true,
      });
    } else if (!user.googleId) {
      user.googleId = googleId;
      user.avatar = picture || user.avatar;
      await user.save();
    }

    const token = generateToken(user);

    res.json({
      token,
      user: {
        ...user.toObject(),
        password: undefined,
      },
    });
  } catch (error) {
    console.error("Google verification error:", error);
    res.status(400).json({
      message: "Invalid Google token",
    });
  }
};

exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE ACCOUNT
exports.deleteAccount = async (req, res) => {
  try {
    const userId = req.user.id; // Comes from auth middleware (protect route)

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Optional: Add confirmation check (e.g., require password)
    const { password } = req.body;
    if (password) {
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: "Incorrect password" });
      }
    }

    // Delete user from database
    await User.findByIdAndDelete(userId);

    // TODO: Also delete related data (activities, chats, etc.) if needed
    // await Activity.deleteMany({ user: userId });
    // await Message.deleteMany({ $or: [{ sender: userId }, { receiver: userId }] });

    res.status(200).json({
      message: "Your account has been successfully deleted. We're sorry to see you go."
    });

  } catch (error) {
    console.error("Delete Account Error:", error);
    res.status(500).json({ message: "Failed to delete account. Please try again later." });
  }
};