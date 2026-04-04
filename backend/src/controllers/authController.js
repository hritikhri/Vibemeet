const User = require("../models/User.js");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
const { OAuth2Client } = require("google-auth-library");
const dotenv = require("dotenv").config();

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
<div style="margin:0; padding:0; background: linear-gradient(135deg, #CDB4DB, #BDE0FE); font-family: 'Poppins', Arial, sans-serif;">
  
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