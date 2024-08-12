import { React, useState } from 'react'
import Navbar from "./components/Navbar";
import "./index.css"
import "./Signup.css"
import { Link, useNavigate } from 'react-router-dom';
import { Button, TextField, MenuItem, Typography, Divider } from '@mui/material';
import { MuiOtpInput } from 'mui-one-time-password-input'
import { backendRoute } from './utils/BackendUrl';
import { z } from 'zod';
import { passwordSchema } from './utils/PasswordValidation';
// TODO: handle roles on the backend routes, post to it with the role you want to create a user/donator depending on selection
// TODO: handle email OTP verification with Resend
const sendEmail = async (setPageStatus, event, formData, setError) => {
  event.preventDefault();
  try {
    //0. CHECK IF THE ACCOUNT EXISTS FIRST
    //1. send email. if return 200, change to another component by setting state, then having parent component conditionally render
    const response = await fetch(`${backendRoute}/sendEmail`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({email: formData.email}),
    });
    if (response.ok) {
      setPageStatus("verifyOtp")
    } else {
      let ourError = await response.json()
      setError(`Failed to create account. Error: ${ourError.error}`)
    }
  } catch (e) {
    console.log(e)
    setError("Unexpected error signing up.")
  }
}

const signupFunction = async (event, formData, otp, navigate) => {
  console.log(otp)
  event.preventDefault();
  const requestBody = {...formData, otp} // create a new object that merges together the otp code into the existing request body
  try {
    const response = await fetch(`${backendRoute}/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify(requestBody),
    });
    if (response.ok) {
      navigate("/login")
    } else {
      console.log(response)
    }
  } catch (e) {
    console.log(e)
  }
}

function ActualSignup({formData, setFormData, setPageStatus}) {
  const [error, setError] = useState(null)
  const handleChange = (event) => {
    setFormData({ ...formData, [event.target.name]: event.target.value })
  }
  const validateForm = () => {
    const schema = z.object({
      role: z.enum(['user', 'donator']),
      name: z.string().min(1, "Username is required"),
      email: z.string().email("Invalid email address"),
      password: passwordSchema,
    });

    try {
      schema.parse(formData);
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        setError(error.errors[0].message);
      } else {
        setError("An unexpected error occurred");
      }
      return false;
    }
  }
  const handleSubmit = (event) => {
    event.preventDefault();
    if (validateForm()) {
      sendEmail(setPageStatus, event, formData, setError);
    }
  }
  return (
    <>
      <Navbar />
      <div className='content'>
        <h1 style={{ color: "#4D4D4D" }}>Sign up</h1>
        <p style={{ color: "#808080" }}>Create an account to access all features.</p>
        <form onSubmit={handleSubmit}>
          <div className="inputSplit">
            <div className="roleField">
              <TextField
                select
                value={formData.role}
                label="Role"
                onChange={(event) => setFormData({ ...formData, 'role': event.target.value })}
              >
                <MenuItem value={'user'}>User</MenuItem>
                <MenuItem value={'donator'}>Donator</MenuItem>
              </TextField>
            </div>
            <TextField label="Username" type="text" name="name" value={formData.name} onChange={handleChange} />
          </div>
          <TextField margin="normal" label="Email" type="email" name="email" value={formData.email} onChange={handleChange} />
          <TextField margin="normal" label="Password" type="password" name="password" value={formData.password} onChange={handleChange} />
          <Button variant="contained" type="submit">Sign up</Button>
          <p className='smallText'>Already a member? <Link to={'/login'}>Log in here</Link></p>
          {error && <p style={{ color: 'red' }}>{error}</p>}
        </form>
      </div>
    </>
  )
}

function VerifyOTP({formData}) {
  const navigate = useNavigate();
  const [otp, setOtp] = useState("");
  function handleOtpChange(newValue) {
    setOtp(newValue)
  }
  return (
    <>
    <Navbar/>
    <div className='content'>
      <h1 style={{ color: "#4D4D4D" }}>Submit OTP code</h1>
      <p style={{ color: "#808080" }}>Please wait 60 seconds before requesting another OTP code.</p>
      <form onSubmit={(event) => signupFunction(event, formData, otp, navigate)}> 
        <MuiOtpInput
          value={otp}
          onChange={handleOtpChange}
          length={6}
        />
        <Divider sx={{ my: 4 }} />
        <Button variant="contained" type="submit">Sign up</Button>
      </form>
    </div>
    </>
  )
}

export default function Signup() {
  // parent component that either renders ActualSignup() or VerifyOTP() depending on whether the user has submitted their email for OTP verification
  // this conditional render is determined by useState(pageStatus)
  const [pageStatus, setPageStatus] = useState("signup");
  const [formData, setFormData] = useState({ role: '', name: '', email: '', password: '' });
  return (
    pageStatus === "verifyOtp" ?
      <VerifyOTP formData={formData}/> :
      <ActualSignup formData={formData} setFormData={setFormData} setPageStatus={setPageStatus}/>
  );
}
