// UserEvents.jsx
import React, { useState, useEffect, useContext } from 'react';
import '../index.css';
import '../donator/DonatorEvents.css';
import { UserNavbar } from '../components/Navbar';
import Button from '@mui/material/Button';
import { UserFooter, DonatorFooter } from '../components/Footer';
import { NavLink, useNavigate } from 'react-router-dom';
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { TokenContext } from "../utils/TokenContext";
// delete prompt
import Snackbar from '@mui/material/Snackbar';
import MuiAlert from '@mui/material/Alert';

//image
import { Box, Modal } from '@mui/material';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import CloseIcon from '@mui/icons-material/Close';

//popup
import VisibilityIcon from '@mui/icons-material/Visibility';
import AccessibilityNewIcon from '@mui/icons-material/AccessibilityNew';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';

//progress
import LinearProgress from '@mui/material/LinearProgress';
import ReactOdometer from 'react-odometerjs';



const backendRoute = 'http://localhost:3000';
const API_BASE_URL = 'http://localhost:3000';

function parseJwt(token) {
    var base64Url = token.split('.')[1];
    var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    var jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function (c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
}

export default function DonatorEvents() {
    const { token } = useContext(TokenContext);
    const userId = parseJwt(token).id;
    const [events, setEvents] = useState([]);
    const [error, setError] = useState(null);
    const [openSnackbar, setOpenSnackbar] = useState(false);
    const [signUpSnackbarOpen, setSignUpSnackbarOpen] = useState(false);
    const [signUpMessage, setSignUpMessage] = useState('');
    const [enlargedImage, setEnlargedImage] = useState(null);
    const [successMessage, setSuccessMessage] = useState('');
    const [deleteSnackbarOpen, setDeleteSnackbarOpen] = useState(false);

    // images
    const handleImageClick = (imageUrl) => {
        setEnlargedImage(imageUrl);
    };
    const handleCloseEnlargedImage = () => {
        setEnlargedImage(null);
    };

    const navigate = useNavigate();
    const [selectedEvent, setSelectedEvent] = useState(null);

    const handleReadMore = (event) => {
        setSelectedEvent(event);
    };

    const handleCloseModal = () => {
        setSelectedEvent(null);
    };

    useEffect(() => {
        fetchEvents();
        console.log(userId)
    }, []);
    const fetchEvents = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/events`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            setEvents(data);

            // Calculate totals
            const eventCount = data.length;
            const participantCount = data.reduce((sum, event) => sum + event.takenSlots, 0);

            // Update state with calculated values
            setTotalEvents(eventCount);
            setTotalParticipants(participantCount);

            // For families supported, we'll keep the existing logic
            // You might want to replace this with actual data if available
            setFamiliesSupported(15673);

            setError(null);
        } catch (error) {
            console.error('Error fetching events:', error);
            setError('Failed to fetch events: ' + error.message);
        }
    };

    // aesthetic design
    const [totalEvents, setTotalEvents] = useState(0);
    const [totalParticipants, setTotalParticipants] = useState(0);
    const [familiesSupported, setFamiliesSupported] = useState(0);




    const calculateDuration = (startDate, endDate) => {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const diffTime = Math.abs(end - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24) + 1);
        return `${diffDays} Day${diffDays > 1 ? 's' : ''}`;
    };

    const handleSignUp = async (eventId) => {
        try {
            const response = await fetch(`${API_BASE_URL}/events/${eventId}/signup`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ userId })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to sign up');
            }

            const updatedEvent = await response.json();
            setEvents(prevEvents => prevEvents.map(event =>
                event.id === eventId ? updatedEvent.event : event
            ));
            setSignUpMessage('You have successfully signed up for this event!');
            setSignUpSnackbarOpen(true);
            setSelectedEvent(updatedEvent.event);
            
            // Update total participants
            setTotalParticipants(prevTotal => prevTotal + 1);
        } catch (error) {
            setSignUpMessage(error.message);
            setSignUpSnackbarOpen(true);
        }
    };
    // signup
    const [cancelSignUpDialogOpen, setCancelSignUpDialogOpen] = useState(false);
    const [eventToCancelSignUp, setEventToCancelSignUp] = useState(null);

    const handleCancelSignUpClick = (event) => {
        setEventToCancelSignUp(event);
        setCancelSignUpDialogOpen(true);
    };

    const handleConfirmCancelSignUp = async () => {
        if (eventToCancelSignUp) {
            try {
                const response = await fetch(`${API_BASE_URL}/events/${eventToCancelSignUp.id}/cancel-signup`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ userId })
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Failed to cancel sign-up');
                }

                const updatedEvent = await response.json();
                setEvents(prevEvents => prevEvents.map(event =>
                    event.id === eventToCancelSignUp.id ? updatedEvent : event
                ));
                setSignUpMessage('You have successfully cancelled your sign-up for this event.');
                setSignUpSnackbarOpen(true);
                setSelectedEvent(updatedEvent);
                
                // Update total participants
                setTotalParticipants(prevTotal => prevTotal - 1);
            } catch (error) {
                setSignUpMessage(error.message);
                setSignUpSnackbarOpen(true);
            }
            setCancelSignUpDialogOpen(false);
            setEventToCancelSignUp(null);
        }
    };

    const [sortBy, setSortBy] = useState('upcoming');
    const sortEvents = (events, sortBy) => {
        const sortedEvents = [...events];
        switch (sortBy) {
            case 'duration':
                sortedEvents.sort((a, b) => {
                    const durationA = (new Date(a.endDate) - new Date(a.startDate)) / (1000 * 60 * 60 * 24);
                    const durationB = (new Date(b.endDate) - new Date(b.startDate)) / (1000 * 60 * 60 * 24);
                    return durationB - durationA;
                });
                break;
            case 'upcoming':
                sortedEvents.sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
                break;
            case 'yourEvents':
                return sortedEvents.filter(event => event.donatorId === userId);
            case 'signedUp':
                return sortedEvents.filter(event => event.participants.some(p => p.userId === userId));
            default:
                return sortedEvents;
        }
        return sortedEvents;
    };


    return (
        <>
            <UserNavbar />
            <div className="events-header">
                <h1>Events</h1>
                <p>Building a strong community, and teaching each other to help each other in need. Events help us become a tight-knit community, and a safe place to ask for help.</p>
            </div>
            <div>
                {error && <p style={{ color: 'red' }}>{error}</p>}
            </div>

            <div className="fridge-stats">
                <div className="fridge-stat-item">
                    <ReactOdometer value={totalEvents} />
                    <p>Total Events</p>
                </div>
                <div className="fridge-stat-item">
                    <ReactOdometer value={totalParticipants} />
                    <p>Total Participants</p>
                </div>
                <div className="fridge-stat-item">
                    <ReactOdometer value={familiesSupported} />
                    <p>Families Supported</p>
                </div>
            </div>
            <div className="sort-container">
                <label htmlFor="sort-select">Sort by: </label>
                <select
                    id="sort-select"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                >
                    <option value="upcoming">Upcoming</option>
                    <option value="duration">Duration</option>
                    <option value="signedUp">Signed Up</option>
                </select>
            </div>
            <hr />
            <div className="events-container">
                {sortEvents(events, sortBy).map((event) => (
                    <Card key={event.id} className="event-card">
                        <div className='displayEventImage'>
                            {event.images && event.images.length > 0 && (
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                    {event.images.map((eventImage, index) => (
                                        <Box
                                            key={eventImage.id}
                                            sx={{
                                                position: 'relative',
                                                width: 200,
                                                height: 200,
                                                cursor: 'pointer',
                                            }}
                                            onClick={() => handleImageClick(`${backendRoute}${eventImage.url}`)}
                                        >
                                            <img
                                                src={`${backendRoute}${eventImage.url}`}
                                                alt={`Event image ${index + 1}`}
                                                style={{
                                                    width: '100%',
                                                    height: '100%',
                                                    objectFit: 'cover',
                                                    border: '1px solid #ddd',
                                                    borderRadius: '4px',
                                                }}
                                            />
                                            <Box
                                                sx={{
                                                    position: 'absolute',
                                                    top: 0,
                                                    left: 0,
                                                    width: '100%',
                                                    height: '100%',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    background: 'rgba(0, 0, 0, 0.3)',
                                                    opacity: 0,
                                                    transition: 'opacity 0.2s',
                                                    '&:hover': {
                                                        opacity: 1,
                                                    },
                                                }}
                                            >
                                                <ZoomInIcon sx={{ color: 'white' }} />
                                            </Box>
                                        </Box>
                                    ))}
                                </Box>
                            )}
                        </div>
                        <div className="event-content">
                            <div className='rightSide-title-summary'>
                                <Typography variant="h5" component="div">
                                    {event.title}
                                </Typography>
                                <Typography variant="body2">
                                    {event.briefSummary}
                                </Typography>
                            </div>
                            <div className="event-details-and-actions">
                                <div className="event-details">
                                    <div className="event-detail">
                                        <CalendarTodayIcon />
                                        <Typography variant="body2">
                                            {new Date(event.startDate).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })} <span> - </span>
                                            {new Date(event.endDate).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
                                        </Typography>
                                    </div>
                                    <div className="event-detail">
                                        <AccessTimeIcon />
                                        <Typography variant="body2">
                                            {calculateDuration(event.startDate, event.endDate)}
                                        </Typography>
                                    </div>
                                </div>

                                <div className="event-actions">
                                    <Button
                                        size="small"
                                        variant="contained"
                                        color="primary"
                                        startIcon={<VisibilityIcon />}
                                        onClick={() => handleReadMore(event)}
                                    >
                                        Read More
                                    </Button>
                                </div>
                            </div>
                            <Box sx={{ width: '100%', mt: 2 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                    <Typography variant="body2">
                                        {event.takenSlots} / {event.maxSlots} slots
                                    </Typography>
                                    <Typography variant="body2">
                                        {Math.round((event.takenSlots / event.maxSlots) * 100)}%
                                    </Typography>
                                </Box>
                                <LinearProgress
                                    variant="determinate"
                                    value={(event.takenSlots / event.maxSlots) * 100}
                                />
                            </Box>
                        </div>
                    </Card>
                ))}
            </div>
            {selectedEvent && (
                <div className="event-modal">
                    <div className="modal-content">
                        <div className="modal-body">
                            <div className="modal-left">
                                {selectedEvent.images && selectedEvent.images.length > 0 && (
                                    <img
                                        src={`${backendRoute}${selectedEvent.images[0].url}`}
                                        alt={`Event image`}
                                    />
                                )}
                                <div className="modal-info">
                                    <div className="modal-info-item">
                                        <CalendarTodayIcon />
                                        <span>
                                            {new Date(selectedEvent.startDate).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
                                            {' - '}
                                            {new Date(selectedEvent.endDate).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
                                        </span>
                                    </div>
                                    <div className="modal-info-item">
                                        <AccessibilityNewIcon />
                                        <span>{selectedEvent.attire}</span>
                                    </div>
                                    <div className="modal-info-item">
                                        <AccessTimeIcon />
                                        <span>{calculateDuration(selectedEvent.startDate, selectedEvent.endDate)}</span>
                                    </div>
                                    <Box sx={{ width: '100%', mt: 2 }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                            <Typography variant="body2">
                                                {selectedEvent.takenSlots} / {selectedEvent.maxSlots} slots
                                            </Typography>
                                            <Typography variant="body2">
                                                {Math.round((selectedEvent.takenSlots / selectedEvent.maxSlots) * 100)}%
                                            </Typography>
                                        </Box>
                                        <LinearProgress
                                            variant="determinate"
                                            value={(selectedEvent.takenSlots / selectedEvent.maxSlots) * 100}
                                        />
                                    </Box>
                                </div>
                            </div>


                            <div className="modal-details">
                                <h2 className="modal-title">{selectedEvent.title}</h2>
                                <p className="modal-summary">{selectedEvent.fullSummary}</p>

                            </div>
                        </div>

                        <div className="modal-footer">

                            {selectedEvent && selectedEvent.participants && selectedEvent.donatorId !== userId && (
                                <Button
                                    className="modal-signup"
                                    onClick={() => selectedEvent.participants.some(p => p.userId === userId)
                                        ? handleCancelSignUpClick(selectedEvent)
                                        : handleSignUp(selectedEvent.id)}
                                >
                                    {selectedEvent.participants.some(p => p.userId === userId) ? 'Cancel Sign Up' : 'Sign Up'}
                                </Button>
                            )}
                            <Button className="modal-close" onClick={handleCloseModal}>Close</Button>
                        </div>
                    </div>

                </div>
            )}
            <Snackbar open={signUpSnackbarOpen} autoHideDuration={6000} onClose={() => setSignUpSnackbarOpen(false)}>
                <MuiAlert elevation={6} variant="filled" onClose={() => setSignUpSnackbarOpen(false)} severity="info">
                    {signUpMessage}
                </MuiAlert>
            </Snackbar>
            {/* signingup */}
            <Snackbar open={deleteSnackbarOpen} autoHideDuration={6000} onClose={() => setDeleteSnackbarOpen(false)}>
                <MuiAlert onClose={() => setDeleteSnackbarOpen(false)} severity="success" sx={{ width: '100%' }}>
                    {successMessage}
                </MuiAlert>
            </Snackbar>
            <Dialog
                open={cancelSignUpDialogOpen}
                onClose={() => setCancelSignUpDialogOpen(false)}
                aria-labelledby="cancel-signup-dialog-title"
                aria-describedby="cancel-signup-dialog-description"
            >
                <DialogTitle id="cancel-signup-dialog-title">{"Confirm Cancellation of Sign Up"}</DialogTitle>
                <DialogContent>
                    <DialogContentText id="cancel-signup-dialog-description">
                        Are you sure you want to cancel your sign-up for the event "{eventToCancelSignUp?.title}"?
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setCancelSignUpDialogOpen(false)} color="primary">
                        No, Keep Me Signed Up
                    </Button>
                    <Button onClick={handleConfirmCancelSignUp} color="error" autoFocus>
                        Yes, Cancel My Sign Up
                    </Button>
                </DialogActions>
            </Dialog>
            <Modal
                open={!!enlargedImage}
                onClose={handleCloseEnlargedImage}
                aria-labelledby="enlarged-image-modal"
                aria-describedby="enlarged-image-description"
            >
                <Box sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: 'auto',
                    maxWidth: '90%',
                    height: 'auto',
                    maxHeight: '90%',
                    bgcolor: 'background.paper',
                    boxShadow: 24,
                    p: 4,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                }}>
                    {enlargedImage && (
                        <img
                            src={enlargedImage}
                            alt="Enlarged event"
                            style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'contain',
                            }}
                        />
                    )}
                    <Button
                        size="small"
                        variant="contained"
                        color="secondary"
                        startIcon={<CloseIcon />}
                        onClick={handleCloseEnlargedImage}
                        sx={{ mt: 2 }}
                    >
                        Close
                    </Button>
                </Box>
            </Modal>
            <UserFooter />
        </>
    );
}
