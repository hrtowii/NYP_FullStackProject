import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { TextField, Button, Typography, Box, CircularProgress } from '@mui/material';
import { backendRoute } from '../utils/BackendUrl';
import { passwordSchema } from '../utils/PasswordValidation';
import { z } from 'zod';
import Navbar from '../components/Navbar'

const ResetPasswordForm = () => {
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });
  const [message, setMessage] = useState('');
  const [isValid, setIsValid] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { token } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const validateToken = async () => {
      try {
        const response = await fetch(`${backendRoute}/validate-reset`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token }),
        });
        const data = await response.json();
        setIsValid(data.isValid);
      } catch (error) {
        setIsValid(false);
        setMessage('Invalid or expired token');
      } finally {
        setIsLoading(false);
      }
    };
    validateToken();
  }, [token]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const schema = z.object({
      password: passwordSchema,
      confirmPassword: z.string()
    }).refine((data) => data.password === data.confirmPassword, {
      message: "Passwords do not match",
      path: ["confirmPassword"],
    });

    try {
      schema.parse(formData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        setMessage(error.errors.map(err => err.message).join(", "));
        return;
      }
    }

    try {
      const response = await fetch(`${backendRoute}/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, password: formData.password }),
      });
      const data = await response.json();
      setMessage(data.message);
      setTimeout(() => navigate('/login'), 3000);
    } catch (error) {
      setMessage('An error occurred. Please try again.');
    }
  };

  if (isLoading) {
    return <CircularProgress />;
  }

  if (!isValid) {
    return <Typography color="error">{message}</Typography>;
  }

  return (
    <>
    <Navbar/>
    <Box sx={{ maxWidth: 800, margin: 'auto', mt: 4 }}>
      <h2 style={{ color: "#4D4D4D" }}>Reset Your Password</h2>
      <form onSubmit={handleSubmit}>
        <TextField
          fullWidth
          type="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          label="New Password"
          variant="outlined"
          margin="normal"
          required
        />
        <TextField
          fullWidth
          type="password"
          name="confirmPassword"
          value={formData.confirmPassword}
          onChange={handleChange}
          label="Confirm New Password"
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
          Reset Password
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

export default ResetPasswordForm;