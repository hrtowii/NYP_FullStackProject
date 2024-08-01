import React, { useState, useEffect, useContext } from 'react';
import '../index.css';
import './DonatorEvents.css';
import { DonatorNavbar } from '../components/Navbar';
import Button from '@mui/material/Button';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import { NavLink, useNavigate } from 'react-router-dom';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CardActions from '@mui/material/CardActions';
import { TokenContext } from "../utils/TokenContext";
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
// delete prompt
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Snackbar from '@mui/material/Snackbar';
import MuiAlert from '@mui/material/Alert';

//image
import { Box, Modal } from '@mui/material';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import CloseIcon from '@mui/icons-material/Close';

//popup
import VisibilityIcon from '@mui/icons-material/Visibility';
import AccessibilityNewIcon from '@mui/icons-material/AccessibilityNew';



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
    //delete
    const [openDialog, setOpenDialog] = useState(false);
    const [eventToDelete, setEventToDelete] = useState(null);
    const [openSnackbar, setOpenSnackbar] = useState(false);

    const [successMessage, setSuccessMessage] = useState('');
    const [deleteSnackbarOpen, setDeleteSnackbarOpen] = useState(false);
    const [signUpSnackbarOpen, setSignUpSnackbarOpen] = useState(false);
    const [signUpMessage, setSignUpMessage] = useState('');

    const [enlargedImage, setEnlargedImage] = useState(null);

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
            setError(null);
        } catch (error) {
            console.error('Error fetching events:', error);
            setError('Failed to fetch events: ' + error.message);
        }
    };
    const handleUpdateClick = (eventId) => {
        navigate(`/donator/updateEvent/${eventId}`);
    };

    const handleDeleteClick = (event) => {
        setEventToDelete(event);
        setOpenDialog(true);
        setSuccessMessage(''); // Clear any previous success message
    };


    const handleCloseDialog = () => {
        setOpenDialog(false);
        setEventToDelete(null);
    };
    const handleConfirmDelete = async () => {
        if (eventToDelete) {
            try {
                const response = await fetch(`${API_BASE_URL}/event/${eventToDelete.id}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
                }

                setEvents(prevEvents => prevEvents.filter(event => event.id !== eventToDelete.id));
                handleCloseDialog();
                setSuccessMessage(`Event "${eventToDelete.title}" has been deleted successfully.`);
                setDeleteSnackbarOpen(true);

            } catch (error) {
                console.error('Error deleting event:', error);
                setError('Failed to delete event: ' + error.message);
                setDeleteSnackbarOpen(true);
            }
        }
    };

    const handleCloseSnackbar = (event, reason) => {
        if (reason === 'clickaway') {
            return;
        }
        setOpenSnackbar(false);
    };
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
                event.id === eventId ? updatedEvent : event
            ));
            setSignUpMessage('You have successfully signed up for this event!');
            setSignUpSnackbarOpen(true);
            setSelectedEvent(updatedEvent); // Update the selected event in the modal
        } catch (error) {
            setSignUpMessage(error.message);
            setSignUpSnackbarOpen(true);
        }
    };

    return (
        <>
            <DonatorNavbar />
            <div className="image-container">
                <img className="full-width-image roundedimg" src="/Eventsphoto.png" alt="Events photos" />
                <div className="overlay">
                    <p className="overlay-text title">Events</p>
                    <p className="overlay-text description">Building a strong community, and teaching each other to help each other in need. Events help us become a tight-knit community, and a safe place to ask for help.</p>
                </div>
            </div>
            <div className="middle-container">
                <NavLink to={"/donator/addEvent"}>
                    <Button variant="contained" color="success">
                        <div className="buttonicon">
                            <AddCircleOutlineIcon />
                        </div>
                        Add Event
                    </Button>
                </NavLink>
            </div>
            <div>
                {successMessage && <p style={{ color: 'green' }}>{successMessage}</p>}
                {error && <p style={{ color: 'red' }}>{error}</p>}
            </div>
            <hr />
            <div className="events-container">
                {events.map((event) => (
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
                                    {event.donatorId == userId && (
                                        <div className="event-action">

                                            <Button
                                                size="small"
                                                variant="contained"
                                                color="primary"
                                                startIcon={<EditIcon />}
                                                onClick={() => handleUpdateClick(event.id)}
                                            >
                                                Update
                                            </Button>
                                            <Button
                                                size="small"
                                                variant="contained"
                                                color="error"
                                                startIcon={<DeleteIcon />}
                                                onClick={() => handleDeleteClick(event)}
                                            >
                                                Delete
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </div>
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
                                </div>
                            </div>


                            <div className="modal-details">
                                <h2 className="modal-title">{selectedEvent.title}</h2>
                                <p className="modal-summary">{selectedEvent.fullSummary}</p>

                            </div>
                        </div>

                        <div className="modal-footer">
                            
                            {selectedEvent.donatorId !== userId && (
                                <Button
                                    className="modal-signup"
                                    onClick={() => handleSignUp(selectedEvent.id)}
                                    disabled={selectedEvent.participants.some(p => p.userId === userId)}
                                >
                                    {selectedEvent.participants.some(p => p.userId === userId) ? 'Signed Up' : 'Sign Up'}
                                </Button>
                            )}
                            <Button className="modal-close" onClick={handleCloseModal}>Close</Button>
                        </div>
                    </div>

                </div>
            )}

            {/* Confirmation Dialog */}

            <Dialog
                open={Boolean(enlargedImage)}
                onClose={handleCloseEnlargedImage}
                maxWidth="lg"
            >
                <DialogContent>
                    <img
                        src={enlargedImage}
                        alt="Enlarged"
                        style={{
                            width: '100%',
                            border: '2px solid black',
                            borderRadius: '4px'
                        }}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseEnlargedImage}>Close</Button>
                </DialogActions>
            </Dialog>
            <Dialog
                open={openDialog}
                onClose={handleCloseDialog}
                aria-labelledby="alert-dialog-title"
                aria-describedby="alert-dialog-description"
            >
                <DialogTitle id="alert-dialog-title">{"Confirm Event Deletion"}</DialogTitle>
                <DialogContent>
                    <DialogContentText id="alert-dialog-description">
                        Are you sure you want to delete the event "{eventToDelete?.title}"?
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog} color="primary">
                        Cancel
                    </Button>
                    <Button onClick={handleConfirmDelete} color="error" autoFocus>
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Snackbar for successful deletion */}
            <Snackbar open={deleteSnackbarOpen} autoHideDuration={6000} onClose={() => setDeleteSnackbarOpen(false)}>
                <MuiAlert onClose={() => setDeleteSnackbarOpen(false)} severity="success" sx={{ width: '100%' }}>
                    {successMessage}
                </MuiAlert>
            </Snackbar>

            {/* signingup */}
            <Snackbar open={deleteSnackbarOpen} autoHideDuration={6000} onClose={() => setDeleteSnackbarOpen(false)}>
                <MuiAlert onClose={() => setDeleteSnackbarOpen(false)} severity="success" sx={{ width: '100%' }}>
                    {successMessage}
                </MuiAlert>
            </Snackbar>

        </>
    );
}