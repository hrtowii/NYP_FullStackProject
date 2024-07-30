import React, { useState, useEffect, useCallback, useContext } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import './index.css';
import { DonatorNavbar } from './components/Navbar';
import { backendRoute } from './utils/BackendUrl';
import { TokenContext } from './utils/TokenContext';
import {
    Button,
    Box,
    Typography,
    Card,
    CardContent,
    Avatar,
    Rating,
    Alert,
    Modal,
    TextField,
    Snackbar,
} from '@mui/material';

export default function ListOfDonators() {
    const [error, setError] = useState(null);
    const [profiles, setProfiles] = useState([]);
    const [openModal, setOpenModal] = useState(false);
    const [selectedDonator, setSelectedDonator] = useState(null);
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const navigate = useNavigate();
    const { token, updateToken } = useContext(TokenContext);

    // Assume we have a way to get the current user's ID, e.g., from context or local storage
    function parseJwt(token) {
        var base64Url = token.split('.')[1];
        var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        var jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function (c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(jsonPayload);
      }
    const currentUserId = parseJwt(token).id

    const fetchProfiles = useCallback(async () => {
        console.log('Fetching profiles...');
        try {
            const response = await fetch(`${backendRoute}/donators`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            if (!response.ok) {
                throw new Error('Failed to fetch profiles');
            }
            const data = await response.json();
            console.log('Profiles fetched:', data);
            setProfiles(data);
        } catch (error) {
            console.error('Error fetching profiles:', error);
            setError('Failed to fetch profiles');
        }
    }, []);

    useEffect(() => {
        fetchProfiles();
    }, [fetchProfiles]);

    const handleOpenModal = (donator) => {
        setSelectedDonator(donator);
        setOpenModal(true);
    };

    const handleCloseModal = () => {
        setOpenModal(false);
        setSelectedDonator(null);
        setRating(0);
        setComment('');
    };

    const handleViewReviews = (donatorId) => {
        navigate(`/profile/${donatorId}`);
    };

    const handleSubmitReview = async () => {
        try {
            console.log('Submitting review for donator:', selectedDonator);
            console.log('Review data:', { rating, comment, userId: currentUserId });
    
            if (!rating || rating < 1 || rating > 5) {
                throw new Error('Please select a rating between 1 and 5');
            }
            if (!comment.trim()) {
                throw new Error('Please enter a comment');
            }
    
            const response = await fetch(`${backendRoute}/review_submit/${selectedDonator.id}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ rating, comment, userId: currentUserId }),
            });
    
            console.log('Response status:', response.status);
            const responseData = await response.json();
            console.log('Response data:', responseData);
    
            if (!response.ok) {
                throw new Error(responseData.error || 'Failed to submit review');
            }
    
            console.log('Review submitted successfully:', responseData);
            setSnackbar({ open: true, message: 'Review submitted successfully', severity: 'success' });
            handleCloseModal();
        } catch (error) {
            console.error('Error submitting review:', error);
            setSnackbar({ open: true, message: `Failed to submit review: ${error.message}`, severity: 'error' });
        }
    };

    if (error) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
                <Alert severity="error">{error}</Alert>
            </Box>
        );
    }

    return (
        <div className="container">
            <DonatorNavbar />
            <Box width="100%" maxWidth="600px" margin="auto">
                <Typography variant="h4" gutterBottom align="center">List of Donators</Typography>
                <Box>
                    {profiles.map((profile, index) => (
                        <Card key={index} sx={{ mb: 2 }}>
                            <CardContent>
                                <Box display="flex" alignItems="center" justifyContent="space-between">
                                    <Box display="flex" alignItems="center">
                                        <Avatar sx={{ mr: 2 }}>{profile.name[0]}</Avatar>
                                        <Box>
                                            <Typography variant="subtitle1">{profile.name}</Typography> 
                                            <Rating value={1} readOnly size="small" />
                                        </Box>
                                    </Box>
                                    <Box>
                                        <Button 
                                            variant="contained" 
                                            color="primary" 
                                            size="small" 
                                            sx={{ mr: 1 }}
                                            onClick={() => handleOpenModal(profile)}
                                        >
                                            Add Review
                                        </Button>
                                        <Button 
                                            variant="outlined" 
                                            color="primary" 
                                            size="small"
                                            onClick={() => handleViewReviews(profile.id)}
                                        >
                                            View Reviews
                                        </Button>
                                    </Box>
                                </Box>
                            </CardContent>
                        </Card>
                    ))}
                </Box>
            </Box>

            <Modal
                open={openModal}
                onClose={handleCloseModal}
                aria-labelledby="add-review-modal"
                aria-describedby="modal-to-add-review-for-donator"
            >
                <Box sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: 400,
                    bgcolor: 'background.paper',
                    boxShadow: 24,
                    p: 4,
                }}>
                    <Typography id="add-review-modal" variant="h6" component="h2">
                        Add Review for {selectedDonator?.name}
                    </Typography>
                    <Box sx={{ mt: 2 }}>
                        <Typography component="legend">Rating</Typography>
                        <Rating
                            name="rating"
                            value={rating}
                            onChange={(event, newValue) => {
                                setRating(newValue);
                            }}
                        />
                        <TextField
                            fullWidth
                            label="Comment"
                            multiline
                            rows={4}
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            sx={{ mt: 2 }}
                        />
                        <Button 
                            variant="contained" 
                            onClick={handleSubmitReview}
                            sx={{ mt: 2 }}
                        >
                            Submit Review
                        </Button>
                    </Box>
                </Box>
            </Modal>

            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
                message={snackbar.message}
            />
        </div>
    );
}