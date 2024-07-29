// TODO:
//  - change mock code to fetch actual data
//  - add alert messages for confirm cancellation
//  - add timing range with similar format 
//  - change reschedule format to look like the existing material ui that im using
//  - change reschedule date format from DD-MM-YY to Day, DD-Month-YYYY
//  - make it such that for each reservation section, only 5 reservation boxes can be created.
//    then put arrows to navigate to different pages of reservations 
//    OR
//  - create another webpage that stores every current/past reservation, create link in reservation.jsx
//    to allow user to see all of his past/current reservations
//  - Add confirm button to confirm collected reservation (then will appear under past reservations section)

import React, { useState, useEffect, useContext } from 'react';
import { Box, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField } from '@mui/material';
import { UserNavbar } from "../components/Navbar";
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import "./Reservation.css";
import { backendRoute } from '../utils/BackendUrl';
import { TokenContext } from '../utils/TokenContext';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';

// Add this function to parse the JWT token
function parseJwt(token) {
    var base64Url = token.split('.')[1];
    var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    var jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
}

// Reservation State Variables
const Reservation = () => {
    const [currentReservations, setCurrentReservations] = useState([]);
    const [pastReservations, setPastReservations] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const { token } = useContext(TokenContext);
    const [userId, setUserId] = useState(null);

    const [openReschedule, setOpenReschedule] = useState(false);  // Dialog for rescheduling reservation
    const [selectedReservation, setSelectedReservation] = useState(null);
    const [newDate, setNewDate] = useState('');
    const [newTimeStart, setNewTimeStart] = useState('');
    const [newTimeEnd, setNewTimeEnd] = useState('');

    const [openCancelDialog, setOpenCancelDialog] = useState(false);  // 1st dialog for cancel confirmation
    const [reservationToCancel, setReservationToCancel] = useState(null);

    const [openSuccessDialog, setOpenSuccessDialog] = useState(false);  // 2nd dialog for cancel confirmation
    const [successMessage, setSuccessMessage] = useState('');

    const [dateError, setDateError] = useState('');  // Validation state variables
    const [timeError, setTimeError] = useState('');

    useEffect(() => {
        if (token) {
            const decodedToken = parseJwt(token);
            setUserId(decodedToken.id);
        } else {
            setError('User not authenticated');
            setIsLoading(false);
        }
    }, [token]);

    useEffect(() => {
        if (userId) {
            fetchReservations();
        }
    }, [userId]);

    const fetchReservations = async () => {
        setIsLoading(true);
        setError(null);

        try {
            console.log('Fetching reservations for user:', userId);
            const currentRes = await fetch(`${backendRoute}/reservation/current/${userId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const pastRes = await fetch(`${backendRoute}/reservation/past/${userId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!currentRes.ok || !pastRes.ok) {
                throw new Error('Failed to fetch reservations');
            }

            const currentData = await currentRes.json();
            const pastData = await pastRes.json();

            console.log('Current data:', currentData);
            console.log('Past data:', pastData);

            // Ensure we're working with arrays
            setCurrentReservations(Array.isArray(currentData) ? currentData : []);
            setPastReservations(Array.isArray(pastData) ? pastData : []);
        } catch (error) {
            console.error('Error fetching reservations:', error);
            setError('Failed to load reservations. ' + error.message);
            // Set up empty arrays in case of error
            setCurrentReservations([]);
            setPastReservations([]);
        } finally {
            setIsLoading(false);
            console.log('Fetch completed.')
        }
    };

    // RESCHEDULE RESERVATION
    
    const handleReschedule = (reservation) => {
        setSelectedReservation(reservation);
        const newDate = new Date(reservation.collectionDate);
        const newTimeStart = new Date(`2000-01-01T${reservation.collectionTimeStart}`);
        const newTimeEnd = new Date(`2000-01-01T${reservation.collectionTimeEnd}`);

        setNewDate(newDate);
        setNewTimeStart(newTimeStart);
        setNewTimeEnd(newTimeEnd);

        // Validate the current values
        validateDate(newDate);
        validateTimes(newTimeStart, newTimeEnd);

        setOpenReschedule(true);
    };

    const validateDate = (date) => {
        if (!date) {
            setDateError('Please select a date');
            return false;
        }
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (date < today) {
            setDateError('Please select a date from today onwards');
            return false;
        }
        setDateError('');
        return true;
    };

    const validateTimes = (start, end) => {
        if (!start || !end) {
            setTimeError('Please select both start and end times');
            return false;
        }
        const startTime = new Date(`2000-01-01T${start.toTimeString().slice(0, 5)}`);
        const endTime = new Date(`2000-01-01T${end.toTimeString().slice(0, 5)}`);
        const minTime = new Date(`2000-01-01T09:00`);
        const maxTime = new Date(`2000-01-01T21:00`);

        if (startTime < minTime || startTime > maxTime || endTime < minTime || endTime > maxTime) {
            setTimeError('Collection time must be between 9 AM and 9 PM');
            return false;
        }

        if (startTime >= endTime) {
            setTimeError('Start time must be earlier than end time');
            return false;
        }
        setTimeError('');
        return true;
    };

    const enforceTimeRestrictions = (time) => {
        if (!time) return time;
        const hours = time.getHours();
        const minutes = time.getMinutes();
        if (hours < 9) return new Date(time.setHours(9, 0, 0, 0));
        if (hours >= 21) return new Date(time.setHours(20, 55, 0, 0));
        return time;
    };

    const handleTimeStartChange = (newValue) => {
        const restrictedTime = enforceTimeRestrictions(newValue);
        setNewTimeStart(restrictedTime);
        validateTimes(restrictedTime, newTimeEnd);
    };

    const handleTimeEndChange = (newValue) => {
        const restrictedTime = enforceTimeRestrictions(newValue);
        setNewTimeEnd(restrictedTime);
        validateTimes(newTimeStart, restrictedTime);
    };

    const handleDateChange = (newValue) => {
        setNewDate(newValue);
        validateDate(newValue);
    };

    const handleRescheduleSubmit = async () => {
        const isDateValid = validateDate(newDate);
        const isTimeValid = validateTimes(newTimeStart, newTimeEnd);

        if (!isDateValid || !isTimeValid) {
            return;
        }

        try {
            const res = await fetch(`${backendRoute}/reservation/${selectedReservation.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    collectionDate: newDate.toISOString().split('T')[0],
                    collectionTimeStart: newTimeStart.toTimeString().slice(0, 5),
                    collectionTimeEnd: newTimeEnd.toTimeString().slice(0, 5),
                }),
            });
            if (res.ok) {
                fetchReservations();
                setOpenReschedule(false);
                setSuccessMessage('Your reservation has been rescheduled successfully.');
                setOpenSuccessDialog(true);
            } else {
                const errorData = await res.json();
                throw new Error(errorData.error || 'Failed to reschedule reservation');
            }
        } catch (error) {
            console.error('Error rescheduling reservation:', error);
            setError('Failed to reschedule reservation. ' + error.message);
        }
    };


    // CANCEL RESERVATION

    const handleCancelConfirm = async () => {
        if (reservationToCancel && reservationToCancel.id) {
            try {
                const res = await fetch(`${backendRoute}/reservation/${reservationToCancel.id}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                if (res.ok) {
                    setCurrentReservations(currentReservations.filter(reservation => reservation.id !== reservationToCancel.id));
                    setOpenCancelDialog(false);
                    setSuccessMessage('Your reservation of [Chicken] has been removed.');
                    setOpenSuccessDialog(true);
                } else {
                    const errorData = await res.json();
                    throw new Error('Failed to cancel reservation');
                }
            } catch (error) {
                console.error('Error cancelling reservation:', error);
                setError('Failed to cancel reservation. ' + error.message);
            }
        } else {
            setError('Failed to cancel reservation. ' + error.message);
        }
    }


    const handleCancelClick = (reservation) => {
        if (reservation && reservation.id) {
            setReservationToCancel(reservation);
            setOpenCancelDialog(true);
        } else {
            console.error('Invalid reservation object:', reservation);
            setError('Unable to cancel reservation: Invalid reservation data');
        }
    };

    // INDIVIDUAL RESERVATION CARD

    const ReservationCard = ({ reservation, isPast }) => (
        <div className="reservation-card">
            <img src="/path/to/default-food-image.jpg" alt="Food" className="food-image" />
            <div className="reservation-details">
                <h3>[Chicken]</h3>
                <p>
                    {new Date(reservation.collectionDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
                <p>
                    {reservation.collectionTimeStart} - {reservation.collectionTimeEnd}
                    {!isPast && (
                        <span
                            className="reschedule-link" onClick={() => handleReschedule(reservation)}>Reschedule
                        </span>
                    )}
                </p>
                <p className={`status status-text ${reservation.collectionStatus.toLowerCase()}`}>
                    Status: {reservation.collectionStatus}
                </p>
            </div>
            <div className="reservation-amount">[100g]</div>
            {!isPast && (
                <Button
                    className="cancel-btn"
                    onClick={() => handleCancelClick(reservation)}
                    variant="contained"
                    color="error"
                    size="small"
                    sx={{
                        position: 'absolute',
                        top: '10px',
                        right: '10px',
                        backgroundColor: '#ff4d4d',
                        '&:hover': {
                            backgroundColor: '#ff3333',
                        },
                    }}>Cancel
                </Button>
            )}
            {isPast && reservation.collectionStatus === 'Collected' && (
                <Button className="review-btn">Write a review</Button>
            )}
        </div>
    );

    return (
        <>
            <UserNavbar />

            <div className="reservation-page">
                <div className="reservation-header">
                    <h1>Reservations</h1>
                    <p>To ensure a smooth experience for everyone, please remember to collect your reservations on time.
                        Timely pickups help us serve you better and maintain availability for other customers. Thank you for your cooperation!</p>
                </div>
                {isLoading ? (
                    <p>Loading reservations...</p>
                ) : error ? (
                    <p className="error-message">{error}</p>
                ) : (
                    <div className="reservation-sections">
                        <div className="reservation-section">
                            <h2>Your Current Reservations:</h2>
                            {currentReservations.length > 0 ? (
                                currentReservations.map(reservation => (
                                    <ReservationCard key={reservation.id} reservation={reservation} isPast={false} />
                                ))
                            ) : (
                                <p>No current reservations.</p>
                            )}
                        </div>
                        <div className="reservation-section">
                            <h2>Your Past Reservations:</h2>
                            {pastReservations.length > 0 ? (
                                pastReservations.map(reservation => (
                                    <ReservationCard key={reservation.id} reservation={reservation} isPast={true} />
                                ))
                            ) : (
                                <p>No past reservations.</p>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* RESCHEDULE DIALOG */}
            <Dialog open={openReschedule} onClose={() => setOpenReschedule(false)}>
                <DialogTitle>Reschedule Reservation</DialogTitle>
                <DialogContent>
                    {selectedReservation && (
                        <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
                            <LocalizationProvider dateAdapter={AdapterDateFns}>
                                <DatePicker
                                    label="Collection Date"
                                    value={newDate}
                                    onChange={(date) => {
                                        setNewDate(date);
                                        validateDate(date);
                                    }}
                                    renderInput={(params) => <TextField {...params} fullWidth error={!!dateError} helperText={dateError} />}
                                    minDate={new Date()}  // Disable past dates
                                />
                                <TimePicker
                                    label="Collection Start Time"
                                    value={newTimeStart}
                                    onChange={(time) => {
                                        const restrictedTime = enforceTimeRestrictions(time);
                                        setNewTimeStart(restrictedTime);
                                        validateTimes(restrictedTime, newTimeEnd);
                                    }}
                                    renderInput={(params) => <TextField {...params} fullWidth error={!!timeError} helperText={timeError} />}
                                />
                                <TimePicker
                                    label="Collection End Time"
                                    value={newTimeEnd}
                                    onChange={(time) => {
                                        const restrictedTime = enforceTimeRestrictions(time);
                                        setNewTimeEnd(restrictedTime);
                                        validateTimes(newTimeStart, restrictedTime);
                                    }}
                                    renderInput={(params) => <TextField {...params} fullWidth error={!!timeError} helperText={timeError} />}
                                />
                            </LocalizationProvider>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenReschedule(false)}>Cancel</Button>
                    <Button
                        onClick={handleRescheduleSubmit}
                        color="primary"
                        variant="contained"
                        disabled={!!dateError || !!timeError}
                        sx={{ '&:hover': { backgroundColor: 'darkblue', } }}>Confirm
                    </Button>
                </DialogActions>
            </Dialog>

            {/* CANCELLATION DIALOG */}
            <Dialog open={openCancelDialog} onClose={() => setOpenCancelDialog(false)}>
                <DialogTitle>
                    <Typography variant="h6" component="div" style={{ display: 'flex', alignItems: 'center' }}>
                        <span style={{ marginRight: '8px', color: '#FFA500' }}>⚠️</span>
                        Removal Confirmation
                    </Typography>
                </DialogTitle>
                <DialogContent>
                    <Typography>
                        Are you sure you want to cancel your reservation?
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenCancelDialog(false)}>No</Button>
                    <Button onClick={handleCancelConfirm} color="primary" variant="contained">
                        Yes
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog open={openSuccessDialog} onClose={() => setOpenSuccessDialog(false)}>
                <DialogTitle>
                    <Typography variant="h6" component="div" style={{ display: 'flex', alignItems: 'center' }}>
                        <CheckCircleOutlineIcon style={{ color: 'green', marginRight: '8px' }} />
                        Reservation Removed
                    </Typography>
                </DialogTitle>
                <DialogContent>
                    <Typography>{successMessage}</Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenSuccessDialog(false)} color="primary" variant="contained">
                        OK
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

export default Reservation;