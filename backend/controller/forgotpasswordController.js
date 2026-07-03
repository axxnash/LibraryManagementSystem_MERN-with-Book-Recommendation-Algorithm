// Handles forgot password using email, phone, and OTP verification
const bcrpyt = require('bcrypt')
const UserModel = require('../models/signUpModel')
const UserOtpVerificationModel = require('../models/userOtpVerificationModel')
const { generateOtp, sendEmail, maskEmail } = require('./signUpController')

const postForgotPassword = async (req, res) => {
  const { email, phone } = req.body

  const checkUser = await UserModel.findOne({ email, phone })

  if (!checkUser) {
    return res
      .status(400)
      .json({ success: false, message: `Invalid Email or Phone` })
  }

  const otpCode = Math.floor(Math.random() * 9000 + 1000)
  const hashedOtpCode = await generateOtp(otpCode)
  const userId = checkUser._id.toString()

  await UserOtpVerificationModel.findOneAndUpdate(
    { userId },
    {
      userId,
      userEmail: checkUser.email,
      otpCode: hashedOtpCode,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 1000 * 60),
    },
    { upsert: true, new: true }
  )

  res.cookie('password-reset-cookie', userId, {
    path: '/',
    expires: new Date(Date.now() + 1000 * 60 * 10),
    httpOnly: true,
    sameSite: 'lax',
  })

  await sendEmail(checkUser.email, otpCode)

  const maskedEmail = await maskEmail(checkUser.email)

  res.status(200).json({
    success: true,
    message: `OTP sent to email ${maskedEmail}`,
  })
}

const patchUpdatePassword = async (req, res) => {
  const { otpCode, newPassword } = req.body
  const userId = req.cookies['password-reset-cookie']

  if (!userId) {
    return res.status(400).json({
      success: false,
      message: `Password reset session expired. Please retry forgot password.`,
    })
  }

  if (!otpCode || !newPassword) {
    return res.status(400).json({
      success: false,
      message: `OTP and new password are required`,
    })
  }

  const checkUser = await UserModel.findById(userId)
  if (!checkUser) {
    return res
      .status(400)
      .json({ success: false, message: `User doesn't exists` })
  }

  const otpData = await UserOtpVerificationModel.findOne({ userId })
  if (!otpData) {
    return res.status(400).json({
      success: false,
      message: `No OTP request found. Please retry forgot password.`,
    })
  }

  if (new Date() > otpData.expiresAt) {
    return res.status(400).json({
      success: false,
      message: `OTP expired. Please request a new one.`,
    })
  }

  const isOtpValid = await bcrpyt.compare(String(otpCode), otpData.otpCode)
  if (!isOtpValid) {
    return res.status(400).json({
      success: false,
      message: `Invalid OTP code`,
    })
  }

  const strongPasswordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/

  if (!strongPasswordRegex.test(newPassword)) {
    return res.status(400).json({
      success: false,
      message:
        'Password must be at least 8 characters and include uppercase, lowercase, number, and special character.',
    })
  }

  const updatedPassword = await bcrpyt.hash(newPassword, 10)

  await UserModel.findByIdAndUpdate(userId, {
    password: updatedPassword,
  })

  await UserOtpVerificationModel.findOneAndDelete({ userId })
  res.clearCookie('password-reset-cookie')

  res
    .status(200)
    .json({ success: true, message: `Password Changed Successfully` })
}

module.exports = { patchUpdatePassword, postForgotPassword }
