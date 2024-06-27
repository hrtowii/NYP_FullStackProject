import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button } from '@mui/material';
import { DatePicker, TimePicker } from '@mui/x-date-pickers';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import './UpdateReservation.css';

const UpdateReservation = ({ reservation, onClose, onSubmit }) => {
    const [newDate, setNewDate] = useState(new Date(reservation.date));
    const [newTimeStart, setNewTimeStart] = useState(new Date(`2000-01-01T${reservation.time.split(' - ')[0]}`));
    const [newTimeEnd, setNewTimeEnd] = useState(new Date(`2000-01-01T${reservation.time.split(' - ')[1]}`));

    const handleSubmit = (e) => {
        e.preventDefault();
        const formattedTime = `${newTimeStart.toTimeString().slice(0, 5)} - ${newTimeEnd.toTimeString().slice(0, 5)}`;
        onSubmit(reservation.id, newDate, formattedTime);
    };

    return (
        <div className="reschedule-modal-overlay">
            <div className="reschedule-modal">
                <h2>Reschedule Reservation</h2>
                <form onSubmit={handleSubmit}>
                    <LocalizationProvider dateAdapter={AdapterDateFns}>
                        <div className="form-field">
                            <DatePicker
                                label="New Date"
                                value={newDate}
                                onChange={(newValue) => setNewDate(newValue)}
                                renderInput={(params) => <TextField {...params} fullWidth />}
                            />
                        </div>
                        <div className="form-field">
                            <TimePicker
                                label="Start Time"
                                value={newTimeStart}
                                onChange={(newValue) => setNewTimeStart(newValue)}
                                renderInput={(params) => <TextField {...params} fullWidth />}
                            />
                        </div>
                        <div className="form-field">
                            <TimePicker
                                label="End Time"
                                value={newTimeEnd}
                                onChange={(newValue) => setNewTimeEnd(newValue)}
                                renderInput={(params) => <TextField {...params} fullWidth />}
                            />
                        </div>
                    </LocalizationProvider>
                    <div className="reservation-modal-buttons">
                        <Button onClick={onClose} variant="outlined">Cancel</Button>
                        <Button type="submit" variant="contained" color="primary">Submit</Button>
                    </div>
                </form>
            </div>
        </div>


        // <div className="reschedule-modal-overlay">
        //     <div className="reschedule-modal">
        //         <h2>Reschedule Reservation</h2>
        //         <form onSubmit={handleSubmit}>
        //             <div>
        //                 <label htmlFor="new-date">New Date:</label>
        //                 <input
        //                     type="date"
        //                     id="new-date"
        //                     value={newDate}
        //                     onChange={(e) => setNewDate(e.target.value)}
        //                     required
        //                 />
        //             </div>
        //             <div>
        //                 <label htmlFor="new-time">New Time:</label>
        //                 <input
        //                     type="time"
        //                     id="new-time"
        //                     value={newTime}
        //                     onChange={(e) => setNewTime(e.target.value)}
        //                     required
        //                 />
        //             </div>
        //             <div className="reservation-modal-buttons">
        //                 <button type="submit">Submit</button>
        //                 <button type="button" onClick={onClose}>Cancel</button>
        //             </div>
        //         </form>
        //     </div>
        // </div>
    );
};

export default UpdateReservation;