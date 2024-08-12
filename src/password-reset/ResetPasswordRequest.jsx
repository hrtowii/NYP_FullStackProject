import React, { useState } from 'react';
import { TextField, Button, Typography, Box } from '@mui/material';
import { backendRoute } from '../utils/BackendUrl';
import Navbar from '../components/Navbar'
const ResetPasswordRequest = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${backendRoute}/reset-password-send-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      setMessage(data.message);
    } catch (error) {
      setMessage('An error occurred. Please try again.');
    }
  };

  return (
    <>
    <Navbar/>
    <Box sx={{ maxWidth: 800, margin: 'auto', mt: 4 }}>
      <h2 style={{ color: "#4D4D4D" }}>Reset Password</h2>
      <form onSubmit={handleSubmit}>
        <TextField
          fullWidth
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          label="Email"
          variant="outlined"
          margin="normal"
          required
        />
        <Button 
          type="submit" 
          variant="contained" 
          color="primary" 
          fullWidth 
          sx={{ mt: 2 }}
        >
          Send Reset Link
        </Button>
      </form>
      {message && (
        <Typography sx={{ mt: 2 }} color="text.secondary">
          {message}
        </Typography>
      )}
    </Box>
    </>
  );
};

export default ResetPasswordRequest;