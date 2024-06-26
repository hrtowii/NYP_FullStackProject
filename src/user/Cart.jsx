import React, { useState } from 'react';
import Navbar from "../components/Navbar";
import { TextField, Button, Select, MenuItem, FormControl, InputLabel } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import './Cart.css';

export default function Cart() {

    const [collectionTime, setCollectionTime] = useState('');
    const [collectionDate, setCollectionDate] = useState(null);
    const [remarks, setRemarks] = useState('');

    const timeSlots = [
        '9:30-10:00', '10:00-10:30', '10:30-11:00', '11:00-11:30',
        '11:30-12:00', '12:00-12:30', '12:30-13:00', '13:00-13:30',
        '13:30-14:00', '14:00-14:30', '14:30-15:00', '15:00-15:30',
        '15:30-16:00', '16:00-16:30', '16:30-17:00', '17:00-17:30',
        '17:30-18:00', '18:00-18:30', '18:30-19:00', '19:00-19:30',
        '19:30-20:00', '20:00-20:30', '20:30-21:00', '21:00-21:30',
        '21:30-22:00'
    ];

    const handleSubmit = (event) => {
        event.preventDefault();
        console.log({
            collectionDate: collectionDate ? dayjs(collectionDate).format('YYYY-MM-DD') : null,
            collectionTime,
            remarks,
        });
    };

    return (
        <>
            <Navbar />

            <div className="cart-header">
                <h1>Shopping Cart</h1> <br></br>
                <p>[Display table of selected items below.]</p><br></br>
                <p>------------------------------------------------------------------------------------</p>
            </div>
            
            <LocalizationProvider dateAdapter={AdapterDayjs}>
                <div className='centered'>
                    <form onSubmit={handleSubmit} className="reservation-form">
                        <div className="reservation-form-row">
                            <FormControl className="time-form-field">
                                <InputLabel id="time-slot-label">Collection Time</InputLabel>
                                <Select
                                    labelId="time-slot-label"
                                    value={collectionTime}
                                    onChange={(e) => setCollectionTime(e.target.value)}
                                    label="Collection Time"
                                >
                                    {timeSlots.map((slot) => (
                                        <MenuItem key={slot} value={slot}>{slot}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                            {/* <TimePicker
                        label="Collection Time"
                        value={collectionTime}
                        onChange={(newValue) => setCollectionTime(newValue)}
                        renderInput={(params) => <TextField {...params} fullWidth margin="normal" />}
                    /> */}
                            <div className="date-form-field">
                                <DatePicker
                                    label="Collection Date"
                                    value={collectionDate}
                                    onChange={(newValue) => setCollectionDate(newValue)}
                                    renderInput={(params) => <TextField {...params} fullWidth margin="normal" />}
                                />
                            </div>
                        </div>
                        <TextField
                            className="remarks-form-field"
                            label="Remarks"
                            value={remarks}
                            onChange={(e) => setRemarks(e.target.value)}
                            multiline
                            rows={4}
                        /><br></br>
                        <div className="reservation-button">
                            <Button variant="contained" type="submit" className="reservation-submit-button">
                                Reserve
                            </Button>
                        </div>
                    </form>
                </div>

            </LocalizationProvider >
        </>
    );
}