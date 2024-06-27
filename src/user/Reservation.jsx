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
//  - implement input validation (start time cannot be later than end time../ date cannot be past)

import React, { useState } from 'react';
import Navbar from "../components/Navbar";
import './Reservation.css';
import UpdateReservation from './UpdateReservation';
import {
    Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography
} from '@mui/material';
import WarningIcon from '@mui/icons-material/Warning';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

const ReservationCard = ({ reservation, onCancel, onReschedule, isPast }) => (
    <div className="reservation-card">
        <img src="/path/to/chicken-image.jpg" alt="image" className="food-image" />
        <div className="reservation-details">
            <h3>{reservation.foodName}</h3>
            <p>{reservation.date} </p>
            <p>{reservation.time}
                {!isPast && <a href="#" className="reschedule-link" onClick={(e) => {
                    e.preventDefault();
                    onReschedule(reservation.id);
                }}>Reschedule</a>}
            </p>
            <p className="status">
                Status: <span className={`status-text ${reservation.status.toLowerCase()}`}>{reservation.status}</span>
            </p>
            {!isPast && reservation.status === 'Uncollected' && (
                <button onClick={() => onCancel(reservation)} className="cancel-btn">Cancel</button>
            )}
            {isPast && (
                <button className="review-btn">Write a review</button>
            )}
        </div>
        <div className="reservation-amount">{reservation.amount}</div>
    </div>
);

const Reservation = () => {
    const sampleCurrentReservations = [
        { id: 1, foodName: 'Chicken', date: 'Tuesday, 24 May 2023', time: '23:00 - 23:30', status: 'Uncollected', amount: '100g' },
        { id: 2, foodName: 'Chicken', date: 'Tuesday, 24 May 2023', time: '23:00 - 23:30', status: 'Uncollected', amount: '100g' },
        { id: 3, foodName: 'Chicken', date: 'Tuesday, 24 May 2023', time: '23:00 - 23:30', status: 'Uncollected', amount: '100g' },
    ];

    const samplePastReservations = [
        { id: 4, foodName: 'Chicken', date: 'Tuesday, 24 May 2023', time: '23:00 - 23:30', status: 'Collected', amount: '100g' },
        { id: 5, foodName: 'Chicken', date: 'Tuesday, 24 May 2023', time: '23:00 - 23:30', status: 'Collected', amount: '100g' },
        { id: 6, foodName: 'Chicken', date: 'Tuesday, 24 May 2023', time: '23:00 - 23:30', status: 'Collected', amount: '100g' },
    ];

    const [currentReservations, setCurrentReservations] = useState(sampleCurrentReservations);
    const [pastReservations, setPastReservations] = useState(samplePastReservations);
    const [selectedReservation, setSelectedReservation] = useState(null);
    const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
    const [openRemovedDialog, setOpenRemovedDialog] = useState(false);
    const [isRescheduling, setIsRescheduling] = useState(false);

    const handleCancel = (reservation) => {
        setSelectedReservation(reservation);
        setOpenConfirmDialog(true);
    };

    const handleConfirmCancel = () => {
        setOpenConfirmDialog(false);
        setOpenRemovedDialog(true);
        setCurrentReservations(currentReservations.filter(r => r.id !== selectedReservation.id));
        setPastReservations([...pastReservations, { ...selectedReservation, status: 'Cancelled' }]);
    };

    const handleCloseDialogs = () => {
        setOpenConfirmDialog(false);
        setOpenRemovedDialog(false);
        setSelectedReservation(null);
    };

    const handleReschedule = (id) => {
        const reservation = currentReservations.find(r => r.id === id);
        setSelectedReservation(reservation);
        setIsRescheduling(true);
    };

    const handleRescheduleSubmit = (id, newDate, newTime) => {
        const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

        const date = new Date(newDate);
        const formattedDate = `${daysOfWeek[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;

        const updatedReservations = currentReservations.map(reservation =>
            reservation.id === id ? { ...reservation, date: formattedDate, time: newTime } : reservation
        );
        setCurrentReservations(updatedReservations);
        setSelectedReservation(null);
        setIsRescheduling(false);
    };

    return (
        <>
            <Navbar />
            {selectedReservation && isRescheduling && (
                <UpdateReservation
                    reservation={selectedReservation}
                    onClose={() => {
                        setSelectedReservation(null);
                        setIsRescheduling(false);
                    }}
                    onSubmit={handleRescheduleSubmit}
                />
            )}
            <div className="reservation-page">
                <div className="reservation-header">
                    <h1>Reservations</h1>
                    <p>To ensure a smooth experience for everyone, please remember to collect your reservations on time.
                        Timely pickups help us serve you better and maintain availability for other customers. Thank you for your cooperation!</p>
                </div>
                <div className="reservation-sections">
                    <div className="reservation-section">
                        <h2>Your Current Reservations:</h2>
                        {currentReservations.map(reservation => (
                            <ReservationCard
                                key={reservation.id}
                                reservation={reservation}
                                onCancel={handleCancel}
                                onReschedule={handleReschedule}
                                isPast={false}
                            />
                        ))}
                    </div>
                    <div className="reservation-section">
                        <h2>Your Past Reservations:</h2>
                        {pastReservations.map(reservation => (
                            <ReservationCard
                                key={reservation.id}
                                reservation={reservation}
                                isPast={true}
                            />
                        ))}
                    </div>
                </div>
            </div>
            <Dialog open={openConfirmDialog} onClose={handleCloseDialogs}>
                <DialogTitle>
                    <Typography variant="h6" component="span" style={{ display: 'flex', alignItems: 'center' }}>
                        <WarningIcon style={{ color: '#FFB900', marginRight: '8px' }} />
                        Removal Confirmation
                    </Typography>
                </DialogTitle>
                <DialogContent>
                    <Typography>Are you sure you want to cancel your reservation?</Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialogs} color="primary">
                        No
                    </Button>
                    <Button onClick={handleConfirmCancel} color="primary" autoFocus>
                        Yes
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog open={openRemovedDialog} onClose={handleCloseDialogs}>
                <DialogTitle>
                    <Typography variant="h6" component="span" style={{ display: 'flex', alignItems: 'center' }}>
                        <CheckCircleIcon style={{ color: '#4CAF50', marginRight: '8px' }} />
                        Reservation Removed
                    </Typography>
                </DialogTitle>
                <DialogContent>
                    <Typography>
                        Your reservation of {selectedReservation?.foodName} has been removed.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialogs} color="primary">
                        OK
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

export default Reservation;










/* Attempt #1 */

// import React, { useState, useEffect } from 'react';
// import Navbar from "../components/Navbar";
// import "./Reservation.css"


// const ReservationCard = ({ reservation, isPast }) => (
//     <div className="reservation-card">
//         <div className="reservation-content">
//             <div className="reservation-details">
//                 <img src="/api/placeholder/50/50" alt={reservation.item} className="reservation-image" />
//                 <div>
//                     <h3>{reservation.item}</h3>
//                     <p>{new Date(reservation.collectionDate).toLocaleDateString()}</p>
//                     <p>{reservation.collectionTime}</p>
//                     <p className={`reservation-status ${reservation.status === 'Uncollected' ? 'uncollected' : 'collected'}`}>{reservation.status}</p>
//                 </div>
//             </div>
//             <div className="reservation-actions">
//                 <p className="reservation-amount">{reservation.amount}</p>
//                 {isPast ? (
//                     <button className="btn btn-review">Write a review</button>
//                 ) : (
//                     <button className="btn btn-cancel">Cancel</button>
//                 )}
//             </div>
//         </div>
//     </div>
// );

// const ReservationDisplay = () => {
//     const [currentReservations, setCurrentReservations] = useState([]);
//     const [pastReservations, setPastReservations] = useState([]);

//     useEffect(() => {
//         const fetchReservations = async () => {
//             try {
//                 const currentRes = await fetch('/api/reservations/current');
//                 const currentData = await currentRes.json();
//                 setCurrentReservations(currentData);

//                 const pastRes = await fetch('/api/reservations/past');
//                 const pastData = await pastRes.json();
//                 setPastReservations(pastData);
//             } catch (error) {
//                 console.error('Error fetching reservations:', error);
//             }
//         };

//         fetchReservations();
//     }, []);

//     return (
//         <div className="reservation-display">
//             <div className="reservation-column current-reservations">
//                 <h2>Your Current Reservations:</h2>
//                 {currentReservations.map(reservation => (
//                     <ReservationCard key={reservation.id} reservation={reservation} isPast={false} />
//                 ))}
//             </div>
//             <div className="reservation-column past-reservations">
//                 <h2>Your Past Reservations:</h2>
//                 {pastReservations.map(reservation => (
//                     <ReservationCard key={reservation.id} reservation={reservation} isPast={true} />
//                 ))}
//             </div>
//         </div>
//     );
// };

// const Reservation = () => {
//     return (
//         <>
//             <Navbar />
//             <div className="reservation_header">
//                 <h1>Reservations</h1> <br></br>
//                 <p>To ensure a smooth experience for everyone, please remember to collect your reservations on
//                     time. Timely pickups help us serve you better and maintain availability for other customers.
//                     Thank you for your cooperation!</p>
//             </div>
//             <ReservationDisplay />
//         </>
//     );
// }

// export default Reservation;

