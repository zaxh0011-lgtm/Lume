import jwt from 'jsonwebtoken';
import User from '../models/User.js'
import { generateAccessToken, generateRefreshToken } from '../utils/generateTokens.js';
import bcrypt from 'bcryptjs'
import { sendOtpEmail } from '../utils/emailService.js';
import connectDB from '../config/db.js'; // Ensure connection is ready

let refreshTokens = [];

// Generate 6 digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

//register
export const register = async (req, res) => {
  await connectDB();
  try {
    const { username, email, password } = req.body;
    // ...

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      if (!existingUser.isVerified) {
        // Resend OTP logic could go here, but for simplicity just tell them to login/verify
        // Or update the existing unverified user
        const otp = generateOTP();
        const hashedPassword = await bcrypt.hash(password, 10);

        existingUser.username = username;
        existingUser.password = hashedPassword;
        existingUser.otp = otp;
        existingUser.otpExpires = Date.now() + 10 * 60 * 1000; // 10 mins
        await existingUser.save();

        await sendOtpEmail(email, otp);

        return res.status(200).json({
          message: "User exists but not verified. New OTP sent.",
          requireOtp: true,
          email: email
        });
      }
      return res.status(400).json({ message: "User already exist please login" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const otp = generateOTP();

    //create user with verified=false
    const user = await User.create({
      username,
      email,
      password: hashedPassword,
      otp,
      otpExpires: Date.now() + 10 * 60 * 1000,
      isVerified: false
    });

    // Send Email
    try {
      await sendOtpEmail(email, otp);
    } catch (emailError) {
      console.error('Email send failed:', emailError);
      // Optional: Delete user if email fails? Or just let them retry.
      // For now, return success but warn.
    }

    return res.status(200).json({
      message: "OTP sent to email. Please verify.",
      requireOtp: true,
      email: email
    });

  } catch (error) {
    console.error(error);
    return res.status(401).json({
      message: "Error while creating user",
      error: error.message
    });
  }
}

// Verify OTP
export const verifyEmail = async (req, res) => {
  await connectDB();
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    if (user.isVerified) {
      return res.status(200).json({ message: "Email already verified. Please login." });
    }

    if (user.otp !== otp || user.otpExpires < Date.now()) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    user.isVerified = true;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    // Generate tokens on success verification
    const accessToken = generateAccessToken(user._id, user.role);
    const refreshToken = generateRefreshToken(user._id);
    refreshTokens.push(refreshToken);

    return res.status(200).json({
      message: "Email verified successfully!",
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      },
      accessToken,
      refreshToken
    });

  } catch (error) {
    return res.status(500).json({ message: "Verification failed", error: error.message });
  }
};

//login
export const login = async (req, res) => {
  await connectDB();
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({
        message: "User not found please sign up"
      });
    }

    // Check verification
    if (!user.isVerified) {
      return res.status(400).json({ message: "Please verify your email first." });
    }

    //check password
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({
        message: "Invalid credentials"
      });
    }

    //generate tokens

    const accessToken = generateAccessToken(user._id, user.role);
    const refreshToken = generateRefreshToken(user._id);
    refreshTokens.push(refreshToken);

    return res.status(200).json({
      message: `Login successfull welcome ${user.username}`,
      user: {
        username: user.username,
        email: user.email,
        id: user._id,
        role: user.role
      },
      accessToken,
      refreshToken
    })
  } catch (error) {
    console.error("Login Error:", error);
    // Differentiate between logic errors and system errors
    if (error.name === 'MongooseServerSelectionError' || error.message.includes('buffering timed out')) {
      return res.status(500).json({
        message: "Database connection failed. Please ensure MongoDB Atlas Network Access allows 0.0.0.0/0.",
        error: error.message
      });
    }
    return res.status(500).json({
      message: "Server error during login",
      error: error.message
    })
  }
}

//for frontend to generate access token every 15min
export const refreshAccessToken = async (req, res) => {

  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(401).json({ message: "Refreshed token required" });
  }

  if (!refreshTokens.includes(refreshToken)) {
    return res.status(401).json({ message: "Invalid refresh token" });
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    const user = await User.findById(decoded.user_id).select('role');
    const accessToken = generateAccessToken(decoded.user_id, user.role);

    return res.status(200).json({ message: "Successfully created access token", accessToken });
  } catch (error) {

    return res.status(403).json({ message: "Invalid or expired refresh token", error });
  }
}

//logout

export const logout = async (req, res) => {

  const { refreshToken } = req.body;
  refreshTokens = refreshTokens.filter(token => token !== refreshToken);

  return res.status(200).json({ message: "Logged out succesfully" });
}

// Forgot Password - Send OTP
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const otp = generateOTP();
    user.otp = otp;
    user.otpExpires = Date.now() + 10 * 60 * 1000; // 10 mins
    await user.save();

    await sendOtpEmail(email, otp);

    return res.status(200).json({ message: "OTP sent to your email" });

  } catch (error) {
    return res.status(500).json({ message: "Error processing request", error: error.message });
  }
};

// Reset Password - Verify OTP and Update Password
export const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.otp !== otp || user.otpExpires < Date.now()) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    return res.status(200).json({ message: "Password reset successfully. Please login." });

  } catch (error) {
    return res.status(500).json({ message: "Error resetting password", error: error.message });
  }
};
