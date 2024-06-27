//  - implement input validation (start time cannot be later than end time../ date cannot be past)
//  - timing cannot be outside of 24hr clock (e.g. 86:74, max 00:00, 23:59)

import React, { useState } from 'react';
import Navbar from "../components/Navbar";
import './Cart.css';
import { useNavigate } from 'react-router-dom';
import {
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
    TextField, Button, Select, MenuItem, FormControl, InputLabel, Box, AppBar, Toolbar, Typography
} from '@mui/material';
import { DatePicker, TimePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';

const Cart = () => {
    const [collectionDate, setCollectionDate] = useState(null);
    const [collectionTimeStart, setCollectionTimeStart] = useState(null);
    const [collectionTimeEnd, setCollectionTimeEnd] = useState(null);
    const [remarks, setRemarks] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch('/reservation', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                },
                body: JSON.stringify({
                    collectionDate,
                    collectionTimeStart,
                    collectionTimeEnd,
                    remarks,
                }),
            });
            if (response.ok) {
                navigate('/reservations');
            } else {
                console.error('Failed to create reservation');
            }
        } catch (error) {
            console.error('Error:', error);
        }
    };

    const cartItems = [
        { food: 'Chicken Breast', quantity: '4 pcs', category: 'Meat', expiryDate: '12/12/2023', remarks: 'NTUC Chicken Breast' },
        { food: 'Pork', quantity: '200g', category: 'Meat', expiryDate: '25/5/2024', remarks: 'Purchased 2 days ago' },
        { food: 'Nugget', quantity: '350g', category: 'Meat', expiryDate: '31/5/2024', remarks: 'Purchased last week' },
        { food: 'Corn', quantity: '2 pcs', category: 'Meat', expiryDate: '19/6/2024', remarks: '-' },
        { food: 'Kailan', quantity: '400g', category: 'Vegetable', expiryDate: '29/5/2024', remarks: 'Consume ASAP' },
    ];

    return (
        <>
            <Navbar />

            <Box sx={{ maxWidth: 800, margin: 'auto', mt: 4 }}>
                <Typography variant="h4" gutterBottom>
                    Reservation Cart
                </Typography>
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Food</TableCell>
                                <TableCell>Quantity</TableCell>
                                <TableCell>Category</TableCell>
                                <TableCell>Expiry Date</TableCell>
                                <TableCell>Remarks</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {cartItems.map((item, index) => (
                                <TableRow key={index}>
                                    <TableCell>{item.food}</TableCell>
                                    <TableCell>{item.quantity}</TableCell>
                                    <TableCell>{item.category}</TableCell>
                                    <TableCell>{item.expiryDate}</TableCell>
                                    <TableCell>{item.remarks}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
                <Box component="form" onSubmit={handleSubmit} sx={{ mt: 4 }}>
                    <LocalizationProvider dateAdapter={AdapterDateFns}>
                        <DatePicker
                            label="Collection Date"
                            value={collectionDate}
                            onChange={(newValue) => setCollectionDate(newValue)}
                            renderInput={(params) => <TextField {...params} fullWidth margin="normal" />}
                        />
                        <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                            <TimePicker
                                label="Collection Time Start"
                                value={collectionTimeStart}
                                onChange={(newValue) => setCollectionTimeStart(newValue)}
                                inputFormat="HH:mm"
                                renderInput={(params) => <TextField {...params} fullWidth />}
                            />
                            <TimePicker
                                label="Collection Time End"
                                value={collectionTimeEnd}
                                onChange={(newValue) => setCollectionTimeEnd(newValue)}
                                inputFormat="HH:mm"
                                renderInput={(params) => <TextField {...params} fullWidth />}
                            />
                        </Box>
                    </LocalizationProvider>
                    <TextField
                        fullWidth
                        multiline
                        rows={4}
                        margin="normal"
                        label="Remarks"
                        value={remarks}
                        onChange={(e) => setRemarks(e.target.value)}
                    />
                    <Button type="submit" className="reserve-button-class" variant="contained" color="primary" sx={{ mt: 2 }}>
                        Reserve
                    </Button>
                </Box>
            </Box>
        </>
    );
};

export default Cart;





/* Testing #1 */

// import React, { useState } from 'react';
// import Navbar from "../components/Navbar";
// import { TextField, Button, Select, MenuItem, FormControl, InputLabel } from '@mui/material';
// import { DatePicker } from '@mui/x-date-pickers/DatePicker';
// import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
// import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
// import dayjs from 'dayjs';
// import './Cart.css';
// import { backendRoute } from '../utils/BackendUrl';
// import { useNavigate } from 'react-router-dom';

// export default function Cart() {
//     const [collectionTime, setCollectionTime] = useState('');
//     const [collectionDate, setCollectionDate] = useState(null);
//     const [remarks, setRemarks] = useState('');

//     const timeSlots = [
//         '9:30-10:00', '10:00-10:30', '10:30-11:00', '11:00-11:30',
//         '11:30-12:00', '12:00-12:30', '12:30-13:00', '13:00-13:30',
//         '13:30-14:00', '14:00-14:30', '14:30-15:00', '15:00-15:30',
//         '15:30-16:00', '16:00-16:30', '16:30-17:00', '17:00-17:30',
//         '17:30-18:00', '18:00-18:30', '18:30-19:00', '19:00-19:30',
//         '19:30-20:00', '20:00-20:30', '20:30-21:00', '21:00-21:30',
//         '21:30-22:00'
//     ];

//     const handleSubmit = async (event) => {
//         event.preventDefault();

//         const reservationData = {
//             collectionDate: collectionDate ? dayjs(collectionDate).format('YYYY-MM-DD') : null,
//             collectionTime,
//             remarks,
//         };

//         console.log(reservationData);

//         try {
//             const response = await fetch(`${backendRoute}/reservation`, {
//                 method: 'POST',
//                 headers: {
//                     'Content-Type': 'application/json'
//                 },
//                 body: JSON.stringify(reservationData)
//             });

//             if (response.ok) {
//                 console.log('Reservation created successfully');
//                 // Optionally, reset form or provide user feedback here
//             } else {
//                 console.error('Failed to create reservation');
//             }
//         } catch (error) {
//             console.error('Error:', error);
//         }
//     };

//     return (
//         <>
//             <Navbar />

//             <div className="cart-header">
//                 <h1>Shopping Cart</h1> <br />
//                 <p>//TODO: Display table of selected items below.</p><br />
//                 <p>------------------------------------------------------------------------------------</p>
//             </div>

//             <LocalizationProvider dateAdapter={AdapterDayjs}>
//                 <div className='centered'>
//                     <form onSubmit={handleSubmit} className="reservation-form">
//                         <div className="reservation-form-row">
//                             <FormControl className="time-form-field">
//                                 <InputLabel id="time-slot-label">Collection Time</InputLabel>
//                                 <Select
//                                     labelId="time-slot-label"
//                                     value={collectionTime}
//                                     onChange={(e) => setCollectionTime(e.target.value)}
//                                     label="Collection Time"
//                                 >
//                                     {timeSlots.map((slot) => (
//                                         <MenuItem key={slot} value={slot}>{slot}</MenuItem>
//                                     ))}
//                                 </Select>
//                             </FormControl>
//                             <div className="date-form-field">
//                                 <DatePicker
//                                     label="Collection Date"
//                                     value={collectionDate}
//                                     onChange={(newValue) => setCollectionDate(newValue)}
//                                     renderInput={(params) => <TextField {...params} fullWidth margin="normal" />}
//                                 />
//                             </div>
//                         </div>
//                         <TextField
//                             className="remarks-form-field"
//                             label="Remarks"
//                             value={remarks}
//                             onChange={(e) => setRemarks(e.target.value)}
//                             multiline
//                             rows={4}
//                         /><br />
//                         <div className="reservation-button">
//                             <Button variant="contained" type="submit" className="reservation-submit-button">
//                                 Reserve
//                             </Button>
//                         </div>
//                     </form>
//                 </div>
//             </LocalizationProvider>
//         </>
//     );
// }

