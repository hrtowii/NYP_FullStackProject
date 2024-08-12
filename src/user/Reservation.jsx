
import React, { useState, useEffect, useContext } from 'react';
import { Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Rating, Box, Avatar, FormControlLabel, Switch, IconButton, Snackbar, Alert } from '@mui/material';
import { NavLink, useNavigate } from 'react-router-dom';
import { UserFooter, DonatorFooter } from '../components/Footer';
import { UserNavbar } from "../components/Navbar";
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import "./Reservation.css";
import { backendRoute } from '../utils/BackendUrl';
import { TokenContext } from '../utils/TokenContext';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import parseJwt from '../utils/parseJwt.jsx'
import DeleteIcon from '@mui/icons-material/Delete';
import CancelIcon from '@mui/icons-material/Cancel';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';


// Reservation State Variables
const Reservation = () => {
    const [currentReservations, setCurrentReservations] = useState([]);
    const [pastReservations, setPastReservations] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const { token } = useContext(TokenContext);
    const [userId, setUserId] = useState(null);
    const [openReschedule, setOpenReschedule] = useState(false);
    const [selectedReservation, setSelectedReservation] = useState(null);
    const [newDate, setNewDate] = useState('');
    const [newTimeStart, setNewTimeStart] = useState('');
    const [newTimeEnd, setNewTimeEnd] = useState('');
    const [openCancelDialog, setOpenCancelDialog] = useState(false);
    const [reservationToCancel, setReservationToCancel] = useState(null);
    const [openSuccessDialog, setOpenSuccessDialog] = useState(false);
    const [openCancelSuccessDialog, setOpenCancelSuccessDialog] = useState(false);
    const [openCollectSuccessDialog, setOpenCollectSuccessDialog] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [dateError, setDateError] = useState('');
    const [timeError, setTimeError] = useState('');
    const [selectedDonation, setSelectedDonation] = useState(null);
    const [visiblePastReservations, setVisiblePastReservations] = useState(5);
    const [openCollectDialog, setOpenCollectDialog] = useState(false);
    const [reservationToCollect, setReservationToCollect] = useState(null);

    // New state variables for review functionality
    const [openReviewModal, setOpenReviewModal] = useState(false);
    const [selectedDonator, setSelectedDonator] = useState(null);
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [ratingError, setRatingError] = useState(false);
    const [isAnonymous, setIsAnonymous] = useState(false);
    const [selectedImages, setSelectedImages] = useState([]);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    const navigate = useNavigate();
    const currentUserRole = parseJwt(token).role;
    const currentUserId = parseJwt(token).id;
    const currentUserName = parseJwt(token).name;

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

    const handleWriteReview = () => {
        navigate('/listofdonators')
    }

    const handleReschedule = (reservation, donation) => {
        setSelectedReservation(reservation);
        setSelectedDonation(donation);
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
                    donationId: selectedDonation.id
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
                const res = await fetch(`${backendRoute}/reservation/${reservationToCancel.id}/cancel`, {
                    method: 'PATCH',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
                if (res.ok) {
                    const data = await res.json();
                    fetchReservations();
                    setOpenCancelDialog(false);
                    setSuccessMessage(data.message || 'Your reservation has been cancelled.');
                    setOpenCancelSuccessDialog(true);
                } else {
                    const errorData = await res.json();
                    throw new Error(errorData.error || 'Failed to cancel reservation');
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

    const handleCollectClick = (reservation) => {
        setReservationToCollect(reservation);
        setOpenCollectDialog(true);
    }

    const handleCollectConfirm = async () => {
        if (reservationToCollect && reservationToCollect.id) {
            try {
                const res = await fetch(`${backendRoute}/reservation/${reservationToCollect.id}/collect`, {
                    method: 'PATCH',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (res.ok) {
                    const data = await res.json();
                    fetchReservations();
                    setOpenCollectDialog(false);
                    setSuccessMessage(data.message || 'Your reservation has been marked as collected.');
                    setOpenCollectSuccessDialog(true);
                } else {
                    const errorData = await res.json();
                    throw new Error(errorData.error || 'Failed to mark reservation as collected');
                }
            } catch (error) {
                console.error('Error marking reservation as collected:', error);
                setError('Failed to mark reservation as collected. ' + error.message);
            }
        } else {
            setError('Failed to mark reservation as collected. Invalid reservation data');
        }
    };

    // John add reviews
    const handleOpenReviewModal = async (donator) => {
        try {
            const response = await fetch(`${backendRoute}/get_donator`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ id: donator.id })
            });

            if (!response.ok) {
                throw new Error('Failed to fetch donator information');
            }

            const donatorData = await response.json();

            setSelectedDonator({ ...donator, name: donatorData.name });
            setOpenReviewModal(true);
        } catch (error) {
            console.error('Error fetching donator information:', error);
        }
    };

    const handleCloseReviewModal = () => {
        setOpenReviewModal(false);
        setSelectedDonator(null);
        setRating(0);
        setComment('');
        setRatingError(false);
        setIsAnonymous(false);
        setSelectedImages([]);
    };

    const handleImageSelect = (event) => {
        const files = Array.from(event.target.files);
        if (files.length > 1) {
            setSnackbar({ open: true, message: 'You can only upload up to 1 image', severity: 'error' });
            return;
        }
        setSelectedImages(files);
    };

    const handleRemoveImage = (index) => {
        setSelectedImages(prevImages => prevImages.filter((_, i) => i !== index));
    };

    const getDisplayName = (name, isAnonymous) => {
        if (isAnonymous) {
            return `${name[0]}${'*'.repeat(8)}`;
        }
        return name;
    };

    const handleSubmitReview = async () => {
        try {
            if (!rating || rating < 1 || rating > 5) {
                setRatingError(true);
                throw new Error('Please select a rating between 1 and 5');
            }

            const formData = new FormData();
            formData.append('rating', rating);
            formData.append('comment', comment);
            formData.append('userId', userId);
            formData.append('isAnonymous', isAnonymous);
            selectedImages.forEach((image, index) => {
                formData.append('images', image);
            });

            const response = await fetch(`${backendRoute}/review_submit/${selectedDonator.id}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to submit review');
            }

            const responseData = await response.json();
            console.log('Review submission response:', responseData);

            setSnackbar({ open: true, message: 'Review submitted successfully', severity: 'success' });
            handleCloseReviewModal();
            fetchReservations();
        } catch (error) {
            console.error('Error submitting review:', error);
            setSnackbar({ open: true, message: `Failed to submit review: ${error.message}`, severity: 'error' });
        }
    };

    const loadMorePast = () => {
        setVisiblePastReservations(prevVisible => prevVisible + 5);
    }

    // INDIVIDUAL RESERVATION CARD
    const ReservationCard = ({ reservation }) => {
        return (
            <>
                {reservation.reservationItems.map((item, index) => (
                    <div key={`${reservation.id}-${index}`} className="reservation-card">
                        <img
                            src={item.food.donation?.image || "/path/to/default-food-image.jpg"}
                            alt={item.food.name}
                            className="food-image"
                        />
                        <div className="reservation-details">
                            <h3>{item.food.name}</h3>
                            <p>
                                {new Date(reservation.collectionDate).toLocaleDateString('en-US', {
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                })}
                            </p>
                            <p>
                                {reservation.collectionTimeStart} - {reservation.collectionTimeEnd}
                                {reservation.collectionStatus === 'Uncollected' && (
                                    <span
                                        className="reschedule-link"
                                        onClick={() => handleReschedule(reservation, item.food.donation)}
                                    >
                                        Reschedule
                                    </span>
                                )}
                            </p>
                            <p className={`status status-text ${reservation.collectionStatus.toLowerCase()}`}>
                                Status: {reservation.collectionStatus}
                            </p>
                        </div>
                        <div className="reservation-actions">
                            <div className="reservation-amount">{item.quantity}g</div>
                            {reservation.collectionStatus === 'Uncollected' && (
                                <div className="button-group">
                                    <Button
                                        className="cancel-btn reservation-button"
                                        onClick={() => handleCancelClick(reservation, item)}
                                        variant="contained"
                                        color="error"
                                        size="small"
                                    >
                                        <DeleteIcon fontSize="small" />
                                        Cancel
                                    </Button>
                                    <Button
                                        className="collect-btn reservation-button"
                                        onClick={() => handleCollectClick(reservation, item)}
                                        variant="contained"
                                        color="success"
                                        size="small"
                                    >
                                        <CheckCircleIcon fontSize="small" />
                                        Collected
                                    </Button>
                                </div>
                            )}
                            {reservation.collectionStatus === 'Collected' && (
                                <Button
                                    className="review-btn reservation-button"
                                    onClick={() => handleOpenReviewModal(item.food.donation.donator)}
                                    variant="contained"
                                    color="primary"
                                    size="small"
                                >
                                    Add a review
                                </Button>
                            )}
                        </div>
                    </div>
                ))}
            </>
        );
    };

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
                                <>
                                    {pastReservations.slice(0, visiblePastReservations).map(reservation => (
                                        <ReservationCard key={reservation.id} reservation={reservation} isPast={true} />
                                    ))}
                                    {visiblePastReservations < pastReservations.length && (
                                        <button className="show-more-button" onClick={loadMorePast}>
                                            Show More
                                        </button>
                                    )}
                                </>
                            ) : (
                                <p>No past reservations.</p>
                            )}

                            {/* {pastReservations.length > 0 ? (
                                pastReservations.map(reservation => (
                                    <ReservationCard key={reservation.id} reservation={reservation} isPast={true} />
                                )) */}
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
                                    minDate={new Date()}
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
                    <Typography variant="h6" component="div" style={{ display: 'flex', alignItems: 'center', color: '#ff0000' }}>
                        <span style={{ marginRight: '8px', color: '#FFA500' }}>⚠️</span>
                        Removal Confirmation
                    </Typography>
                </DialogTitle>
                <DialogContent>
                    <Typography>
                        Are you sure you want to cancel your reservation?<br></br>
                        <span style={{ color: '#ffa500' }}>(this action cannot be reversed)</span>
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenCancelDialog(false)}>No</Button>
                    <Button onClick={handleCancelConfirm} color="primary" variant="contained">
                        Yes
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog open={openCancelSuccessDialog} onClose={() => setOpenCancelSuccessDialog(false)}>
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
                    <Button onClick={() => setOpenCancelSuccessDialog(false)} color="primary" variant="contained">
                        OK
                    </Button>
                </DialogActions>
            </Dialog>

            {/* COLLECT CONFIRMATION DIALOG */}
            <Dialog open={openCollectDialog} onClose={() => setOpenCollectDialog(false)}>
                <DialogTitle>
                    <Typography variant="h6" component="div" style={{ display: 'flex', alignItems: 'center' }}>
                        <span style={{ marginRight: '8px', color: '#4CAF50' }}>⚠️</span>
                        Collection Confirmation
                    </Typography>
                </DialogTitle>
                <DialogContent>
                    <Typography>
                        Are you sure you have collected the item?<br></br>
                        <span style={{ color: '#ffa500' }}>(this action cannot be reversed)</span>
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenCollectDialog(false)}>No</Button>
                    <Button onClick={handleCollectConfirm} color="primary" variant="contained">
                        Yes
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog open={openCollectSuccessDialog} onClose={() => setOpenCollectSuccessDialog(false)}>
                <DialogTitle>
                    <Typography variant="h6" component="div" style={{ display: 'flex', alignItems: 'center' }}>
                        <CheckCircleOutlineIcon style={{ color: 'green', marginRight: '8px' }} />
                        Reservation Collected
                    </Typography>
                </DialogTitle>
                <DialogContent>
                    <Typography>{successMessage}</Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenCollectSuccessDialog(false)} color="primary" variant="contained">
                        OK
                    </Button>
                </DialogActions>
            </Dialog>

            {/* REVIEW MODAL */}
            <Dialog
                open={openReviewModal}
                onClose={handleCloseReviewModal}
                aria-labelledby="add-review-modal"
                aria-describedby="modal-to-add-review-for-donator"
            >
                <DialogTitle>
                    <DialogTitle>
                        Write review for {selectedDonator?.name || `Donator #${selectedDonator?.id}` || 'Unknown Donator'}
                    </DialogTitle>
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ mt: 2 }}>
                        <Typography component="legend">Rating *</Typography>
                        <Rating
                            name="rating"
                            value={rating}
                            onChange={(event, newValue) => {
                                setRating(newValue);
                                setRatingError(false);
                            }}
                        />
                        {ratingError && (
                            <Typography color="error" variant="caption" display="block" sx={{ mt: 1 }}>
                                Please select a rating
                            </Typography>
                        )}
                        <TextField
                            fullWidth
                            label="Comment (optional)"
                            multiline
                            rows={4}
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            sx={{ mt: 2 }}
                        />
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={isAnonymous}
                                    onChange={(e) => setIsAnonymous(e.target.checked)}
                                    name="anonymous"
                                />
                            }
                            label="Submit anonymously"
                            sx={{ mt: 2 }}
                        />
                        <Typography variant="body2" sx={{ mt: 1 }}>
                            Your username will be shown as: {getDisplayName(currentUserName, isAnonymous)}
                        </Typography>
                        <Box sx={{ mt: 2 }}>
                            <input
                                accept="image/*"
                                style={{ display: 'none' }}
                                id="raised-button-file"
                                multiple
                                type="file"
                                onChange={handleImageSelect}
                            />
                            <label htmlFor="raised-button-file">
                                <Button variant="contained" component="span">
                                    Upload Image (Max 1)
                                </Button>
                            </label>
                        </Box>
                        {selectedImages.length > 0 && (
                            <Box sx={{ mt: 2 }}>
                                {selectedImages.map((image, index) => (
                                    <Box key={index} sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                                        <Typography>{image.name}</Typography>
                                        <IconButton onClick={() => handleRemoveImage(index)}>
                                            <CancelIcon />
                                        </IconButton>
                                    </Box>
                                ))}
                            </Box>
                        )}
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseReviewModal}>Cancel</Button>
                    <Button onClick={handleSubmitReview} variant="contained" color="primary">
                        Submit Review
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Snackbar for notifications */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%' }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>

            <UserFooter />
        </>
    );
};
export default Reservation;