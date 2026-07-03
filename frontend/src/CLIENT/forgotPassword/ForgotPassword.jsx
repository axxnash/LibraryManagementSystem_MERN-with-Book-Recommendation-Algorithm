import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { backend_server } from '../../main'
import './forgot.css'
import axios from 'axios'
import { toast, Toaster } from 'react-hot-toast'

const ForgotPassword = () => {
  const ForgotPassword_API = `${backend_server}/api/v1/forgotpassword`

  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [otpCode, setOtpCode] = useState('')

  const [isEmailPhoneValid, setIsEmailPhoneValid] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const validateEmailPhone = await axios.post(ForgotPassword_API, {
        email,
        phone,
      })

      toast.success(validateEmailPhone.data.message)
      setIsEmailPhoneValid(true)

      setEmail('')
      setPhone('')
    } catch (error) {
      console.log(error.response)
      toast.error(error.response.data.message)
    }
  }

  const handleGoBack = () => {
    navigate(-1) // Navigate back one page
  }

  // Updating Password
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordMatch, setPasswordMatch] = useState(true)

  const handlePasswordFormSubmit = async (e) => {
    e.preventDefault()
    if (password === confirmPassword) {
      const alphanumericRegex =
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/

      const isPasswordValid = alphanumericRegex.test(password)
      if (!isPasswordValid) {
        return toast(
          'Password must be at least 8 characters and include uppercase, lowercase, number, and special character.',
          {
            icon: 'ℹ️',
          }
        )
      }

      try {
        const response = await axios.patch(ForgotPassword_API, {
          otpCode,
          newPassword: password,
        })

        toast.success(response.data.message)

        setOtpCode('')
        setPassword('')
        setConfirmPassword('')
        setPasswordMatch(true)

        navigate('/login', { replace: true })
      } catch (error) {
        console.log(error.response)
        toast.error(error.response.data.message)
      }
    } else {
      setPasswordMatch(false)
      setTimeout(() => {
        setPasswordMatch(true)
      }, 3000)
    }
  }

  return (
    <div className='container'>
      <h1 className='h2 text-center my-3'>Recover Account </h1>

      <div className='d-flex flex-column align-items-center '>
        <form onSubmit={handleSubmit} className='w-50'>
          <div className='form-group'>
            <label>Email:</label>
            <input
              type='email'
              className='form-control'
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              name='email'
              autoComplete='off'
            />
          </div>

          <div className='form-group'>
            <label>Phone:</label>
            <input
              type='text'
              className='form-control'
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              name='phone'
              pattern='9\d{9}'
              minLength='10'
              maxLength='10'
              autoComplete='off'
            />
          </div>

          <div className='text-center recover-password-div'>
            <button type='submit' className='btn btn-success my-2 btn-block '>
              Recover Password
            </button>
          </div>
        </form>

        {/* Password FORM */}
        {isEmailPhoneValid ? (
          <form onSubmit={handlePasswordFormSubmit}>
            <h1 className='h2 text-center my-3'>Update Password</h1>
            <div className='form-group'>
              <label>OTP Code:</label>
              <input
                type='text'
                minLength={4}
                maxLength={4}
                className='form-control'
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                required
                autoComplete='off'
              />
            </div>
            <div className='form-group'>
              <label>New Password:</label>
              <input
                type='password'
                minLength={8}
                className='form-control'
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete='off'
              />
            </div>
            <div className='form-group'>
              <label>Confirm Password:</label>
              <input
                minLength={8}
                type='password'
                className='form-control'
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                autoComplete='off'
              />
            </div>
            {!passwordMatch && (
              <div className='alert alert-danger' role='alert'>
                Password doesn't match
              </div>
            )}
            <div className='text-center'>
              <button type='submit' className='btn btn-primary my-3'>
                Submit
              </button>
            </div>
          </form>
        ) : (
          ''
        )}

        {/* Go Back button */}
        <button className='btn btn-secondary mt-3' onClick={handleGoBack}>
          Go Back
        </button>
      </div>
    </div>
  )
}

export default ForgotPassword
