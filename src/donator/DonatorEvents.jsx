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
import {TokenContext} from "../utils/TokenContext";
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
    const {token} = useContext(TokenContext);
    const userId = parseJwt(token).id;
    const [events, setEvents] = useState([]);
    const [error, setError] = useState(null);
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

    const handleDeleteClick = async (eventId, eventTitle) => {
        if (window.confirm(`Are you sure you want to delete the event "${eventTitle}"?`)) {
            try {
                console.log(`Attempting to delete event with ID: ${eventId}`);
                const response = await fetch(`${API_BASE_URL}/event/${eventId}`, {
                    method: 'DELETE',
                });
    
                console.log('Delete response status:', response.status);
    
                if (!response.ok) {
                    const errorText = await response.text();
                    console.error('Error response body:', errorText);
                    throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
                }
    
                console.log(`Successfully deleted event: ${eventTitle}`);
                setSuccessMessage(`You have successfully deleted "${eventTitle}"`);
                
                // Update the local state instead of fetching all events again
                setEvents(prevEvents => prevEvents.filter(event => event.id !== eventId));
    
                // Clear the success message after 2 seconds
                setTimeout(() => {
                    setSuccessMessage('');
                }, 2000);
    
            } catch (error) {
                console.error('Error deleting event:', error);
                setError('Failed to delete event: ' + error.message);
            }
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
                    <Card key={event.id} sx={{ minWidth: 275, margin: 2 }}>
                        <CardContent>
                            <Typography variant="h5" component="div">
                                {event.title}
                            </Typography>
                            <Typography variant="body2">
                                {event.briefSummary}
                            </Typography>
                            <Typography sx={{ mb: 1.5 }} color="text.secondary">
                                {new Date(event.startDate).toLocaleDateString()} - {new Date(event.endDate).toLocaleDateString()}
                            </Typography>
                        </CardContent>
                        {event.donatorId == userId ? 
                        <>
                        <CardActions>
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
                                onClick={() => handleDeleteClick(event.id, event.title)}
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

        </>
    );
}