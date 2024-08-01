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

    const navigate = useNavigate();

    useEffect(() => {
        fetchEvents();
        console.log(userId)
    }, []);


    const fetchEvents = async () => {
        try {
            console.log('Fetching events from:', `${API_BASE_URL}/donator/events`);
            const response = await fetch(`${API_BASE_URL}/donator/events`);
            console.log('Response status:', response.status);
            console.log('Response headers:', response.headers);

            if (!response.ok) {
                const text = await response.text();
                console.error('Error response body:', text);
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const contentType = response.headers.get("content-type");
            if (!contentType || !contentType.includes("application/json")) {
                const text = await response.text();
                console.error('Response was not JSON:', text);
                throw new TypeError("Oops, we haven't got JSON!");
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
                console.log(`Attempting to delete event with ID: ${eventToDelete.id}`);
                const response = await fetch(`${API_BASE_URL}/event/${eventToDelete.id}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                });

                console.log('Delete response status:', response.status);

                if (!response.ok) {
                    const errorText = await response.text();
                    console.error('Error response body:', errorText);
                    throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
                }

                console.log(`Successfully deleted event: ${eventToDelete.title}`);

                // Update the local state
                setEvents(prevEvents => prevEvents.filter(event => event.id !== eventToDelete.id));

                // Close the dialog and show the snackbar
                handleCloseDialog();
                setSuccessMessage(`Event "${eventToDelete.title}" has been deleted successfully.`);
                setOpenSnackbar(true);

            } catch (error) {
                console.error('Error deleting event:', error);
                setError('Failed to delete event: ' + error.message);
                setOpenSnackbar(true);
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
                    <Card key={event.id} sx={{ minWidth: 275, margin: 2 }}>
                        <CardContent>
                            <Typography variant="h5" component="div">
                                {event.title}
                            </Typography>
                            <Typography variant="body2">
                                {event.briefSummary}
                            </Typography>
                        </CardContent>
                        {event.donatorId == userId ?
                            <>
                                <CardActions>
                                    <div style={{ display: 'flex', justifyContent: 'flex-start', gap: '25px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #ccc', borderRadius: '4px', padding: '4px 8px' }}>
                                            <CalendarTodayIcon style={{ fontSize: '1rem', marginRight: '4px' }} />
                                            <Typography variant="body2">
                                                {new Date(event.startDate).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })} <span> - </span>
                                                {new Date(event.endDate).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
                                            </Typography>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #ccc', borderRadius: '4px', padding: '4px 8px' }}>
                                            <AccessTimeIcon style={{ fontSize: '1rem', marginRight: '4px' }} />
                                            <Typography variant="body2">
                                                {calculateDuration(event.startDate, event.endDate)}
                                            </Typography>
                                        </div>

                                    </div>
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
                                </CardActions>
                            </>
                            : <div></div>
                        }
                    </Card>
                ))}
            </div>
            {/* Confirmation Dialog */}
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
            <Snackbar open={openSnackbar} autoHideDuration={6000} onClose={handleCloseSnackbar}>
                <MuiAlert onClose={handleCloseSnackbar} severity="success" sx={{ width: '100%' }}>
                    Event deleted successfully!
                </MuiAlert>
            </Snackbar>

        </>
    );
}