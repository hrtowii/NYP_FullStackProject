// TO-DO:
//  - Amend and fix to replace hardcode user/donation id 



import React, { useState, useEffect } from 'react';
import { TextField, Button, Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';
import { UserNavbar } from "../components/Navbar";
// import "./UserLanding";
import { backendRoute } from '../utils/BackendUrl';


const Cart = ({ selectedItems, userId }) => {
  const [cartItems, setCartItems] = useState([]);
  const [collectionDate, setCollectionDate] = useState('');
  const [collectionTimeStart, setCollectionTimeStart] = useState('');
  const [collectionTimeEnd, setCollectionTimeEnd] = useState('');
  const [remarks, setRemarks] = useState('');
  const [dateError, setDateError] = useState('');
  const [timeError, setTimeError] = useState('');

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


// Fetch selected items
    const fetchSelectedItems = async () => {
      const items = await Promise.all(selectedItems.map(async (id) => {
        const response = await fetch(`${backendRoute}/donations/${id}`);
        return response.json();
      }));
      setCartItems(items);
    };
    fetchSelectedItems();
    
    [selectedItems]

    const handleReserve = async () => {
      if (!validateDate(collectionDate) || !validateTimes()) {
        return;
      }

    const currentUserId = 1;  
    // const selectedDonationId = 1;  // Replace w actual donation ID

    const payload = {
      userId,
      donationIds: selectedItems,
      collectionDate,
      collectionTimeStart,
      collectionTimeEnd,
      remarks,
    };

    console.log('Sending reservation payload:', payload);

    try {
      const response = await fetch(`${backendRoute}/reservation`, {  // using fetch() to send POST req to backend
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
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
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Food</TableCell>
                <TableCell>Quantity</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Expiry Date</TableCell>
                <TableCell>Donator</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {cartItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.food.name}</TableCell>
                  <TableCell>{item.food.quantity}</TableCell>
                  <TableCell>{item.food.type}</TableCell>
                  <TableCell>{new Date(item.food.expiryDate).toLocaleDateString()}</TableCell>
                  <TableCell>{item.donator.person.name}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        
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
        <Button variant="contained" onClick={handleReserve} fullWidth disabled={!!dateError || !!timeError || cartItems.length === 0}>
          Reserve
        </Button>
      </Box>
    </>
  );
};

export default Cart;