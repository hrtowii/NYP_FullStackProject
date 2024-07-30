// TO-DO:
//  - Add alert/message box to show "Item reserved", upon clicking of "Reserve" button


import React, { useState, useEffect, useContext } from 'react';
import { TextField, Button, Typography, Alert, Grid } from '@mui/material';
import Box from '@mui/material/Box';
import { UserNavbar } from "../components/Navbar";
import "./UserLanding";
import { backendRoute } from '../utils/BackendUrl';
import { TokenContext } from '../utils/TokenContext';



const Cart = ({ cartItems }) => {
  const [userId, setUserId] = useState(null);
  const [collectionDate, setCollectionDate] = useState('');
  const [collectionTimeStart, setCollectionTimeStart] = useState('');
  const [collectionTimeEnd, setCollectionTimeEnd] = useState('');
  const [remarks, setRemarks] = useState('');
  const [dateError, setDateError] = useState('');
  const [timeError, setTimeError] = useState('');
  const [showAlert, setShowAlert] = useState(false);
  const [isFormValid, setIsFormValid] = useState(false);

  const { token, updateToken } = useContext(TokenContext);


  function parseJwt(token) {
    var base64Url = token.split('.')[1];
    var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    var jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function (c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  }

  const clearForm = () => {
    setCollectionDate('');
    setCollectionTimeStart('');
    setCollectionTimeEnd('');
    setRemarks('');
    setDateError('');
    setTimeError('');
    setIsFormValid(false);
  };

  useEffect(() => {
    validateForm();
  }, [collectionDate, collectionTimeStart, collectionTimeEnd, dateError, timeError]);

  const validateForm = () => {
    const isValid = collectionDate && collectionTimeStart && collectionTimeEnd && !dateError && !timeError;
    setIsFormValid(isValid);
  }


  // Validate inputs (time, date)
  useEffect(() => {
    validateTimes();
  }, [collectionTimeStart, collectionTimeEnd]);

  const validateDate = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedDate = new Date(date);

    if (selectedDate < today) {  // Make sure that past date cannot be selected
      setDateError('Please select a date from today onwards');
      return false;
    }
    setDateError('');
    return true;
  };

  const validateTimes = () => {
    if (collectionTimeStart && collectionTimeEnd) {
      const start = new Date(`2000-01-01T${collectionTimeStart}`);
      const end = new Date(`2000-01-01T${collectionTimeEnd}`);
      const minTime = new Date(`2000-01-01T09:00`);  // From 9am-9pm ONLY 
      const maxTime = new Date(`2000-01-01T21:00`);

      if (start < minTime || start > maxTime || end < minTime || end > maxTime) {  // Validation #3
        setTimeError('Collection time must be between 9 AM and 9 PM');
        return false;
      }

      if (start >= end) {  // Validation #2
        setTimeError('Start time must be earlier than end time');
        return false;
      }
    }
    setTimeError('');
    return true;
  };

  const handleDateChange = (e) => {
    const newDate = e.target.value;
    setCollectionDate(newDate);
    validateDate(newDate);
  };

  const enforceTimeRestrictions = (time) => {
    const [hours, minutes] = time.split(':').map(Number);
    if (hours < 9) return '09:00';  // auto set to valid timing if user anyhow
    if (hours >= 21) return '20:55';
    return time;
  };

  const handleReserve = async () => {
    if (!isFormValid || !validateDate(collectionDate) || !validateTimes()) {
      return;
    }


    const payload = {
      userId,
      collectionDate,
      collectionTimeStart,
      collectionTimeEnd,
      remarks,
    };

    console.log('Sending reservation payload:', payload);

    try {
      const id = parseJwt(token).id
      const response = await fetch(`${backendRoute}/reservation/${id}`, {  // using fetch() to send POST req to backend
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create reservation');
      }

      const data = await response.json();
      console.log('Reservation created:', data);
      setShowAlert(true);
      clearForm();
      // Handle successful reservation (e.g., clear cart, show success message)
    } catch (error) {
      console.error('Error creating reservation:', error.message);
      // Handle error (e.g., show error message to user)
    }
  };

  useEffect(() => {
    if (showAlert) {
      const timer = setTimeout(() => {
        setShowAlert(false);
      }, 3000);  // Alert stays for 3s

      return () => clearTimeout(timer);
    }
  }, [showAlert]);

  return (
    <>
      <UserNavbar />
      <Box sx={{ padding: 3, maxWidth: 800, margin: 'auto' }}>
        <Typography variant="h4" align="center" gutterBottom sx={{ mb: 4 }}>
          Reservation Cart
        </Typography>

        {showAlert && (
          <Alert
            severity="success"
            sx={{
              mb: 2,
              width: '100%',
              justifyContent: 'center',
              fontSize: '1.1rem',
              '& .MuiAlert-icon': { fontSize: '2rem' }
            }}
          >
            Reserved Successfully!
          </Alert>
        )}

        <Grid container spacing={3}>
          <Grid item xs={12}>
            <TextField
              label="Collection Date"
              type="date"
              value={collectionDate}
              onChange={handleDateChange}
              InputLabelProps={{ shrink: true }}
              fullWidth
              error={!!dateError}
              helperText={dateError}
              inputProps={{
                min: new Date().toISOString().split('T')[0]
              }}
              sx={{ '& .MuiInputBase-input': { fontSize: '1.1rem', padding: '14px' } }}
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              label="Collection Time Start"
              type="time"
              value={collectionTimeStart}
              onChange={(e) => setCollectionTimeStart(enforceTimeRestrictions(e.target.value))}
              InputLabelProps={{ shrink: true }}
              fullWidth
              error={!!timeError}
              inputProps={{ step: 300 }}
              sx={{ '& .MuiInputBase-input': { fontSize: '1.1rem', padding: '14px' } }}
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              label="Collection Time End"
              type="time"
              value={collectionTimeEnd}
              onChange={(e) => setCollectionTimeEnd(enforceTimeRestrictions(e.target.value))}
              InputLabelProps={{ shrink: true }}
              fullWidth
              error={!!timeError}
              helperText={timeError}
              inputProps={{ step: 300 }}
              sx={{ '& .MuiInputBase-input': { fontSize: '1.1rem', padding: '14px' } }}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              label="Remarks"
              multiline
              rows={4}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              fullWidth
              sx={{ '& .MuiInputBase-input': { fontSize: '1.1rem' } }}
            />
          </Grid>
        </Grid>

        <Button
          variant="contained"
          onClick={handleReserve}
          fullWidth
          disabled={!isFormValid}
          sx={{ mt: 4, py: 1.5, fontSize: '1.1rem' }}
        >
          RESERVE
        </Button>
      </Box>
    </>
  );
};

export default Cart;





