import React, { useState, useEffect, useContext } from 'react';
import { TextField, Button, Box, Typography } from '@mui/material';
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


  function parseJwt(token) {
    var base64Url = token.split('.')[1];
    var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    var jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function (c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  }
  const { token, updateToken } = useContext(TokenContext);


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
    if (!validateDate(collectionDate) || !validateTimes()) {
      return;
    }


    const payload = {
      userId,
      // donationId: selectedDonationId,
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
      // Handle successful reservation (e.g., clear cart, show success message)
    } catch (error) {
      console.error('Error creating reservation:', error.message);
      // Handle error (e.g., show error message to user)
    }
  };

  return (
    <>
      <UserNavbar />

      <Box>
        <Typography variant="h4">Reservation Cart</Typography>
        {/* Display cart items here */}
        {cartItems && cartItems.length > 0 && (
          <Box my={2}>
            <Typography variant="h6">Cart Items:</Typography>
            {cartItems.map((item, index) => (
              <Typography key={index}>{item.name} - Quantity: {item.quantity}</Typography>
            ))}
          </Box>
        )}
        <TextField
          label="Collection Date"
          type="date"
          value={collectionDate}
          onChange={handleDateChange}
          InputLabelProps={{ shrink: true }}
          fullWidth
          margin="normal"
          error={!!dateError}
          helperText={dateError}
          inputProps={{
            min: new Date().toISOString().split('T')[0]
          }}
        />
        <TextField
          label="Collection Time Start"
          type="time"
          value={collectionTimeStart}
          onChange={(e) => setCollectionTimeStart(e.target.value)}
          InputLabelProps={{ shrink: true }}
          fullWidth
          margin="normal"
          error={!!timeError}
          inputProps={{
            step: 300, // 5 min steps
          }}
        />
        <TextField
          label="Collection Time End"
          type="time"
          value={collectionTimeEnd}
          onChange={(e) => setCollectionTimeEnd(e.target.value)}
          InputLabelProps={{ shrink: true }}
          fullWidth
          margin="normal"
          error={!!timeError}
          helperText={timeError}
          inputProps={{
            step: 300, // 5 min steps
          }}
        />
        <TextField
          label="Remarks"
          multiline
          rows={4}
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
          fullWidth
          margin="normal"
        />
        <Button variant="contained" onClick={handleReserve} fullWidth disabled={!!dateError || !!timeError}>
          Reserve
        </Button>
      </Box>
    </>
  );
};

export default Cart;