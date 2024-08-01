import React, { useState, useEffect, useCallback, useContext } from 'react';
import { NavLink, useParams } from 'react-router-dom';
import '../index.css';
import './DonatorLanding.css';
import "./DonateItem.css";
import { DonatorNavbar } from '../components/Navbar';
import { backendRoute } from '../utils/BackendUrl';
import { TokenContext } from '../utils/TokenContext';
import {
    Button,
    Typography,
    Card,
    CardContent,
    LinearProgress,
    Avatar,
    Rating,
    CircularProgress,
    Alert,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Container,
} from '@mui/material';
import Box from '@mui/material/Box';
import parseJwt from '../utils/parseJwt.jsx'

export default function DonateItem() {
    const [donations, setDonations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { token, updateToken } = useContext(TokenContext);
    const { donatorId } = useParams();
    const [reviews, setReviews] = useState([]);
    const [donationGoal, setDonationGoal] = useState(null);
    const [totalDonations, setTotalDonations] = useState(0);
    const [openGoalModal, setOpenGoalModal] = useState(false);
    const [goalInput, setGoalInput] = useState(null);
    const [goalError, setGoalError] = useState(null);
    const [achievement, setAchievement] = useState('');
    const [goalAchieved, setGoalAchieved] = useState(false);
    const [goalAchievedDialogOpen, setGoalAchievedDialogOpen] = useState(false); // State for the goal achieved dialog

    const fetchDonations = useCallback(async () => {
        const donatorId = parseJwt(token).id
        if (!donatorId) {
            setError('No donator ID provided');
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const response = await fetch(`${backendRoute}/donations/${donatorId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            console.log(data)
            setDonations(data.donations);
            setError(null);
        } catch (error) {
            console.error('Error fetching donations:', error);
            setError('Failed to fetch donations. Please try again later.');
        } finally {
            setLoading(false);
        }
    }, [token]);

    const fetchReviews = useCallback(async () => {
        const donatorId = parseJwt(token).id
        if (!donatorId) {
            setError('No donator ID provided');
            setLoading(false);
            return;
        }
        console.log('Fetching reviews...');
        try {
            const response = await fetch(`${backendRoute}/reviews/${donatorId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            if (!response.ok) {
                throw new Error('Failed to fetch reviews');
            }
            const data = await response.json();
            console.log('Reviews fetched:', data);
            setReviews(data);
        } catch (error) {
            console.error('Error fetching reviews:', error);
            // Handle error (e.g., show an error message to the user)
        }
    }, [donatorId, token]);

    // Fetch total donations
    const fetchTotalDonations = useCallback(async () => {
        const donatorId = parseJwt(token).id
        if (!donatorId) {
            setError('No donator ID provided');
            return;
        }
        try {
            const response = await fetch(`${backendRoute}/api/donations/${donatorId}/total`);
            if (!response.ok) {
                throw new Error('Failed to fetch total donations');
            }
            const data = await response.json();
            console.log(data)
            setTotalDonations(data.totalQuantity);
        } catch (error) {
            console.error('Error fetching total donations:', error);
            setError('Failed to fetch total donations. Please try again later.');
        }
    }, [token]);

    const formatDate = (dateString) => {
        if (!dateString) return "Unreserved";
        const date = new Date(dateString);
        return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    };

    const formatImagePath = (path) => {
        if (!path) return '';
        const formattedPath = `${backendRoute}/${path.replace(/\\/g, '/').replace(/^public/, '')}`;
        console.log('Formatted Image Path:', formattedPath);
        return path.replace(/\\/g, '/').replace(/^public/, '');
    };

    const determineAchievement = (totalQuantity) => {
        let newAchievement = '';
        if (totalQuantity >= 10000) {
            newAchievement = 'MrBeast';
        } else if (totalQuantity >= 5000) {
            newAchievement = 'Pro';
        } else if (totalQuantity >= 1000) {
            newAchievement = 'Intermediate';
        } else {
            newAchievement = 'Noob';
        }
        setAchievement(newAchievement);
    };

    const updateAchievement = async () => {
        const donatorId = parseJwt(token).id;
        if (!donatorId) {
            setError('No donator ID provided');
            return;
        }

        console.log('Updating achievement to:', achievement); // Log the current achievement

        try {
            console.log(achievement)
            const response = await fetch(`${backendRoute}/donators/${donatorId}/achievement`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ achievement }),
            });

            if (!response.ok) {
                throw new Error('Failed to update achievement');
            }

            const data = await response.json();
            console.log('Achievement updated successfully:', data); // Log the success response
        } catch (error) {
            console.error('Error updating achievement:', error);
            setError('Failed to update achievement. Please try again later.');
        }
    };

    const fetchInitialGoal = useCallback(async () => {
        const donatorId = parseJwt(token).id;
        if (!donatorId) {
            setError('No donator ID provided');
            setLoading(false);
            return;
        }
        try {
            const response = await fetch(`${backendRoute}/donators/${donatorId}/goal`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            if (!response.ok) {
                throw new Error('Failed to fetch donation goal');
            }
            const data = await response.json();
            setDonationGoal(data.donationGoal || 1000); // Fallback to 1000 if no goal is set
            setGoalInput(data.donationGoal || 1000);
        } catch (error) {
            console.error('Error fetching donation goal:', error);
            setError('Failed to fetch donation goal. Please try again later.');
        }
    }, [token]);

    useEffect(() => {
        fetchDonations();
        fetchReviews();
        fetchTotalDonations();
        fetchInitialGoal(); // Add the function call
    }, [fetchDonations, fetchReviews, fetchTotalDonations, fetchInitialGoal]);


    useEffect(() => {
        determineAchievement(totalDonations);
        if (totalDonations >= donationGoal && !goalAchieved) {
            setGoalAchieved(true);
            setGoalAchievedDialogOpen(true);
        } else if (totalDonations < donationGoal) {
            setGoalAchieved(false);
        }
        updateAchievement();
    }, [totalDonations, donationGoal, goalAchieved]);
    
    // Add this separate effect to reset the dialog when the goal changes
    useEffect(() => {
        setGoalAchieved(false);
        setGoalAchievedDialogOpen(false);
    }, [donationGoal]);

    const handleOpenGoalModal = () => {
        setOpenGoalModal(true);
    };

    const handleCloseGoalModal = () => {
        setOpenGoalModal(false);
    };

    const handleCloseGoalAchievedDialog = () => {
        setGoalAchievedDialogOpen(false);
    };


    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
                <Alert severity="error">{error}</Alert>
            </Box>
        );
    }

    const handleGoalChange = (event) => {
        setGoalInput(event.target.value);
    };

    const handleGoalSubmit = async () => {
        const donatorId = parseJwt(token).id;
        if (!donatorId) {
            setError('No donator ID provided');
            return;
        }

        if (parseInt(goalInput, 10) <= totalDonations) {
            setGoalError('Donation goal cannot be lower than the current total donations in g.');
            return;
        }

        try {
            const response = await fetch(`${backendRoute}/donators/${donatorId}/goal`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ donationGoal: parseInt(goalInput, 10) }),
            });

            if (!response.ok) {
                throw new Error('Failed to update donation goal');
            }

            const data = await response.json();
            setDonationGoal(data.donationGoal);
            setGoalInput(data.donationGoal);
            setGoalError(null); // Clear any previous errors
        } catch (error) {
            console.error('Error updating donation goal:', error);
            setGoalError('Failed to update donation goal. Please try again later.');
        } finally {
            handleCloseGoalModal(); // Close modal on success or error
        }
    };

    const handleSetGoal = async () => {
        const donatorId = parseJwt(token).id
        if (!donatorId) {
            setError('No donator ID provided');
            return;
        }
        const goal = parseInt(goalInput);
        if (isNaN(goal) || goal <= 0) {
            setGoalError('Please enter a valid goal greater than 0');
            return;
        }
        try {
            const response = await fetch(`${backendRoute}/donators/${donatorId}/goal`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ goal }),
            });

            if (!response.ok) {
                throw new Error('Failed to update donation goal');
            }

            const data = await response.json();
            setDonationGoal(goal);
            setOpenGoalModal(false);
            setGoalError(null);
        } catch (error) {
            console.error('Error updating donation goal:', error);
            setError('Failed to update donation goal. Please try again later.');
        }
    };


    const achievements = [
        { name: 'Noob', description: 'Donated less than 1000 grams' },
        { name: 'Intermediate', description: 'Donated less than 5000 grams' },
        { name: 'Pro', description: 'Donated less than 10000 grams' },
        { name: 'MrBeast', description: 'Donated 10000 grams or more' },
    ];

    const uncollectedItems = [
        { name: 'Chicken', date: 'Tuesday, 24 May 2023', time: '23:00 - 23:30', quantity: '100g', status: 'Uncollected' },
        { name: 'Chicken', date: 'Unreserved', time: 'Unreserved', quantity: '100g', status: 'Unreserved' },
    ];

    const collectedItems = [
        // { name: 'Chicken', date: 'Tuesday, 24 May 2023', time: '23:00 - 23:30', quantity: '100g', status: 'Collected' },
    ];

    return (
        <div className="container">
            <DonatorNavbar />
            <div className='contents'>
                <div className="centered">
                    <div className="action-buttons">
                        <Button variant="contained" color="primary" component={NavLink} to="/donator/ManageDonations">
                            Manage Donations
                        </Button>
                        <Button variant="contained" color="secondary" component={NavLink} to="/donator/DonateProgress">
                            Track Donation Progress
                        </Button>
                        <Button variant="contained" color="secondary" component={NavLink} to="/donator/DonateItem">
                            Donate New Item
                        </Button>
                    </div>
                </div>
                <Box justifyContent="center" textAlign="center" mt={2}>
                    <Typography variant="h4" gutterBottom mt={2}>
                        Your Donations
                    </Typography>
                    <Typography variant="h6" gutterBottom mt={1}>
                        Achievement: {achievement}
                    </Typography>
                </Box>

                <Box display="flex" justifyContent="space-between" mt={2} ml={5} mr={5}>
                    <Box width="60%">
                        <Typography variant="h6" gutterBottom>Uncollected</Typography>
                        <Box bgcolor="error.main" p={2} borderRadius={2}>
                            {donations.length === 0 ? (
                                <Alert severity="info">You have no uncollected donations.</Alert>
                            ) : (
                                donations.flatMap((donation) =>
                                    donation.foods.map((food) => (
                                        <Card key={`${donation.id}-${food.id}`} sx={{ mb: 2, bgcolor: '' }}>
                                            <CardContent>
                                                <Box display="flex" justifyContent="space-between" alignItems="center">
                                                    <img
                                                        src={`${backendRoute}${formatImagePath(donation.image)}`}
                                                        alt={food.name}
                                                        style={{
                                                            width: 100,
                                                            height: 100,
                                                            objectFit: 'cover',
                                                            border: '2px solid #000', // Add a border with 2px width, solid style, and black color
                                                            borderRadius: '4px' // Optional: Add rounded corners
                                                        }}
                                                    />

                                                    <Box>
                                                        <Typography variant="h6">{food.name}</Typography>
                                                        <Typography variant="body2">
                                                            Collection date: {donation.reservations && donation.reservations.length > 0
                                                                ? formatDate(donation.reservations[0].collectionDate)
                                                                : "Unreserved"}
                                                        </Typography>
                                                        <Typography variant="body2">
                                                            Collection Start Time: {donation.reservations && donation.reservations.length > 0
                                                                ? donation.reservations[0].collectionTimeStart
                                                                : "Unreserved"}
                                                        </Typography>
                                                        <Typography variant="body2">
                                                            Collection End Time: {donation.reservations && donation.reservations.length > 0
                                                                ? donation.reservations[0].collectionTimeEnd
                                                                : "Unreserved"}
                                                        </Typography>
                                                        <Typography variant="body2">
                                                            Status: {donation.reservations && donation.reservations.length > 0
                                                                ? donation.reservations[0].collectionStatus
                                                                : "Unreserved"}
                                                        </Typography>
                                                    </Box>
                                                    <Typography variant="h6">{food.quantity + " g"}</Typography>
                                                </Box>
                                            </CardContent>
                                        </Card>
                                    ))
                                )
                            )}
                        </Box>

                        <Typography variant="h6" gutterBottom mt={4}>Progress</Typography>
                        <Box
                            sx={{
                                position: 'relative',
                                height: 15, // Thicker progress bar
                                borderRadius: 8, // Thicker border radius
                                border: '3px solid lightgrey', // Thicker and light grey border
                                backgroundColor: 'lightgrey', // Light grey background
                            }}
                        >
                            <LinearProgress
                                variant="determinate"
                                value={(totalDonations / donationGoal) * 100}
                                sx={{
                                    height: '100%',
                                    borderRadius: 'inherit', // Inherit the border radius from the container
                                    backgroundColor: 'transparent', // Make background transparent to show the border
                                    '& .MuiLinearProgress-bar': {
                                        backgroundColor: '#4caf50', // Completed portion color (green)
                                        borderRadius: 8, // Match the border radius of the container
                                    },
                                }}
                            />
                        </Box>

                        <Dialog open={goalAchievedDialogOpen} onClose={handleCloseGoalAchievedDialog}>
                            <DialogTitle>Congratulations!</DialogTitle>
                            <DialogContent>
                                <Typography>
                                    You have achieved your donation goal of {donationGoal} grams!
                                </Typography>
                            </DialogContent>
                            <DialogActions>
                                <Button onClick={handleCloseGoalAchievedDialog} color="primary">
                                    Close
                                </Button>
                            </DialogActions>
                        </Dialog>



                        <Typography variant="body1" mt={2}>
                            {`Total Donations: ${totalDonations}g / Goal: ${donationGoal}g`}
                        </Typography>

                        <Typography variant="h6" gutterBottom mt={4}>Collected</Typography>
                        <Box bgcolor="success.main" p={2} borderRadius={2}>
                            {collectedItems.length === 0 ? (
                                <Alert severity="info">You have no collected donations.</Alert>
                            ) : (
                                collectedItems.map((item, index) => (
                                    <Card key={index} sx={{ mb: 2, bgcolor: 'success.light' }}>
                                        <CardContent>
                                            <Box display="flex" justifyContent="space-between" alignItems="center">
                                                <Box>
                                                    <Typography variant="h6">{item.name}</Typography>
                                                    <Typography variant="body2">{item.date}</Typography>
                                                    <Typography variant="body2">{item.time}</Typography>
                                                    <Typography variant="body2">Status: {item.status}</Typography>
                                                </Box>
                                                <Typography variant="h6">{item.quantity}</Typography>
                                            </Box>
                                        </CardContent>
                                    </Card>
                                ))
                            )}
                        </Box>
                    </Box>

                    <Box width="35%" >
                        <Typography variant="h6" gutterBottom>Your Reviews</Typography>
                        <Box bgcolor="grey.200" p={2} borderRadius={2}>
                            {reviews.length === 0 ? (
                                <Alert severity="info">You have no reviews yet.</Alert>
                            ) : (
                                reviews.map((review) => (
                                    <Card key={review.id} sx={{ mb: 2 }}>
                                        <CardContent>
                                            <Box display="flex" alignItems="center">
                                                <Avatar sx={{ mr: 2 }}>{'J'}</Avatar>
                                                <Box>
                                                    <Typography variant="subtitle1">{review.user?.person?.name || 'Unknown User'}</Typography>
                                                    <Rating value={review.rating} readOnly size="small" />
                                                </Box>
                                            </Box>
                                            <Typography variant="body2" mt={1}>{review.comment}</Typography>
                                        </CardContent>
                                    </Card>
                                ))
                            )}
                        </Box>
                    </Box>
                </Box>

                <Box justifyContent="center" textAlign="center" mt={4} mb={5}>
                    <Typography variant="h4" component="h1">Donation Goal</Typography>
                    <Typography variant="h6">Current Goal: {donationGoal} grams</Typography>
                    <Typography variant="h6">Total Donations: {totalDonations} grams</Typography>
                    <Typography variant="h6">Current Achievement: {achievement}</Typography>

                    <Button variant="contained" color="primary" onClick={handleOpenGoalModal}>
                        Set New Goal
                    </Button>

                    <Dialog open={openGoalModal} onClose={handleCloseGoalModal}>
                        <DialogTitle>Set New Donation Goal</DialogTitle>
                        <DialogContent>
                            <TextField
                                autoFocus
                                margin="dense"
                                label="New Donation Goal"
                                type="number"
                                fullWidth
                                value={goalInput}
                                onChange={handleGoalChange}
                                error={!!goalError}
                                helperText={goalError}
                            />
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={handleCloseGoalModal} color="primary">
                                Cancel
                            </Button>
                            <Button onClick={handleGoalSubmit} color="primary">
                                Submit
                            </Button>
                        </DialogActions>
                    </Dialog>
                </Box>

                <Box mt={4} mb={6} textAlign="center">
                    <Typography mb={2} variant="h4" component="h1">Achievements</Typography>
                    <Box
                        display="flex"
                        flexDirection="row"
                        flexWrap="wrap"
                        justifyContent="center"
                        alignItems="center"
                        sx={{ gap: 2 }}
                    >
                        {achievements.map((achievementItem) => (
                            <Card
                                key={achievementItem.name}
                                sx={{
                                    minWidth: 200,
                                    bgcolor: achievement === achievementItem.name ? 'primary.main' : 'grey.200',
                                    color: achievement === achievementItem.name ? 'white' : 'black',
                                }}
                            >
                                <CardContent>
                                    <Typography variant="h6">{achievementItem.name}</Typography>
                                    <Typography variant="body2">{achievementItem.description}</Typography>
                                </CardContent>
                            </Card>
                        ))}
                    </Box>
                </Box>
            </div>
        </div>
    );
}
