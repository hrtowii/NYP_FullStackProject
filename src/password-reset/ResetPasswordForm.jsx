import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { TextField, Button, Typography, Box, CircularProgress } from '@mui/material';
import { backendRoute } from '../utils/BackendUrl';
const ResetPasswordForm = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setMessage('Passwords do not match');
      return;
    }
    try {
      const response = await fetch(`${backendRoute}/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, password }),
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
    <Box sx={{ maxWidth: 400, margin: 'auto', mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        Reset Your Password
      </Typography>
      <form onSubmit={handleSubmit}>
        <TextField
          fullWidth
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          label="New Password"
          variant="outlined"
          margin="normal"
          required
        />
        <TextField
          fullWidth
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
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
  );
};

export default ResetPasswordForm;