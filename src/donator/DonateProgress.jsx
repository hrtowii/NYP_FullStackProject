import React, { useState, useEffect, useCallback, useContext } from 'react';
import { NavLink, useParams, Link } from 'react-router-dom';
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
    Box,
    List,
    ListItem,
    ListItemText,
    ListItemAvatar,
    Divider,
} from '@mui/material';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import AssignmentIcon from '@mui/icons-material/Assignment';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import AddIcon from '@mui/icons-material/Add';
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
    const [goalAchievedDialogOpen, setGoalAchievedDialogOpen] = useState(false);
    const [enlargedImage, setEnlargedImage] = useState(null);
    const [collectedDonations, setCollectedDonations] = useState([]);
    const [uncollectedDonations, setUncollectedDonations] = useState([]);

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
            console.log(data);

            // Separate collected and uncollected donations
            const collected = [];
            const uncollected = [];

            data.donations.forEach(donation => {
                if (donation.reservations && donation.reservations.length > 0 &&
                    donation.reservations[0].collectionStatus === 'Collected') {
                    collected.push(donation);
                } else {
                    uncollected.push(donation);
                }
            });

            setCollectedDonations(collected);
            setUncollectedDonations(uncollected);
            setError(null);
        } catch (error) {
            console.error('Error fetching donations:', error);
            setError('Failed to fetch donations. Please try again later.');
        } finally {
            setLoading(false);
        }
    }, [token]);

    const fetchReviews = useCallback(async () => {
        const donatorId = parseJwt(token).id;
        if (!donatorId) {
            console.error('No donator ID available');
            return;
        }
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
            console.log('Fetched reviews:', data);
            setReviews(data);
        } catch (error) {
            console.error('Error fetching reviews:', error);
        }
    }, [token, backendRoute]);

    const getDisplayName = (review) => {
        if (review.isAnonymous) {
            const name = review.user?.person?.name || 'Unknown User';
            return `${name[0]}${'*'.repeat(6)}`;
        }
        return review.user?.person?.name || 'Unknown User';
    };

    const truncateMessage = (message, maxLength = 100) => {
        if (message.length <= maxLength) return message;
        return message.substr(0, maxLength) + '...';
    };

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
            newAchievement = 'Supreme';
        } else if (totalQuantity >= 5000) {
            newAchievement = 'Diamond';
        } else if (totalQuantity >= 1000) {
            newAchievement = 'Gold';
        } else {
            newAchievement = 'Silver';
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
        fetchInitialGoal();
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

    const handleCloseEnlargedImage = () => {
        setEnlargedImage(null);
    };

    const handleImageClick = (imageUrl) => {
        setEnlargedImage(imageUrl);
    };


    const achievements = [
        { name: 'Silver', description: 'Donated less than 1000 grams' },
        { name: 'Gold', description: 'Donated less than 5000 grams' },
        { name: 'Diamond', description: 'Donated less than 10000 grams' },
        { name: 'Supreme', description: 'Donated 10000 grams or more' },
    ];

    return (
        <div className="container">
            <DonatorNavbar />
            <div className='contents'>
                <div className="centered" style={{ marginTop: '0', marginBottom: '20px' }}>
                    <Box
                        display="flex"
                        flexDirection="row"
                        gap={4}
                        ml={6}
                        mr={6}
                        mb={2}
                        sx={{
                            boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.1)', // Shadow for the outer box
                            padding: 2, // Padding inside the outer box
                            borderRadius: 2, // Rounded corners for the outer box
                            backgroundColor: '#f5f5f5' // Optional: Background color for the outer box
                        }}
                    >
                        <Box textAlign="center" mt={2}>
                            <Button
                                component={NavLink}
                                to="/donator/ManageDonations"
                                sx={{
                                    backgroundColor: 'white', // Light blue background for the button
                                    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)', // Shadow for the button
                                    '&:hover': {
                                        backgroundColor: '#f0f0f0' // Slightly different background color on hover
                                    }
                                }}
                                startIcon={<AssignmentIcon />} // Use the startIcon prop
                            >
                                Manage Donations
                            </Button>
                        </Box>
                        <Box textAlign="center" mt={2}>
                            <Button
                                component={NavLink}
                                to="/donator/DonateProgress"
                                sx={{
                                    backgroundColor: '#b3e0ff', // White background for the button
                                    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)', // Shadow for the button
                                    '&:hover': {
                                        backgroundColor: '#f0f0f0' // Slightly different background color on hover
                                    }
                                }}
                                startIcon={<ShowChartIcon />} // Use the startIcon prop
                            >
                                Donator Dashboard
                            </Button>
                        </Box>
                        <Box textAlign="center" mt={2}>
                            <Button
                                component={NavLink}
                                to="/donator/DonateItem"
                                sx={{
                                    backgroundColor: 'white', // White background for the button
                                    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)', // Shadow for the button
                                    '&:hover': {
                                        backgroundColor: '#f0f0f0' // Slightly different background color on hover
                                    }
                                }}
                                startIcon={<AddIcon />} // Use the startIcon prop
                            >
                                Donate New Item
                            </Button>
                        </Box>
                    </Box>
                </div>

                <Box sx={{backgroundColor: 'lightgrey'}} p={2} marginLeft={3} marginRight={3} paddingBottom={4} borderRadius={3}>
                <Box justifyContent="center" textAlign="center" mt={2}>
                    <Typography variant="h4" gutterBottom mt={2}>
                        Current Rank:
                    </Typography>
                    <Box mt={2} mb={2} textAlign="center">
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
                </Box>

                <Box display="flex" alignItems="center" ml={6} mr={6} mt={4}>
                    <Box flex={1} mr={2}>
                        <Typography variant="h6" gutterBottom>
                            Progress
                        </Typography>
                        <Box
                            sx={{border: '2px solid black',
                                borderRadius: 8,
                            }}>

                        <Box
                            sx={{
                                position: 'relative',
                                height: 15, // Thicker progress bar
                                borderRadius: 8, // Thicker border radius
                                border: '3x solid white', // Thicker and light grey border
                                backgroundColor: 'white', // Light grey background
                                padding: 0.3
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
                        </Box>
                        <Typography variant="body1" mt={2}>
                            {`Total Donations: ${totalDonations}g / Goal: ${donationGoal}g`}
                        </Typography>
                    </Box>
                    <Box>
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
                </Box>
                </Box>
                <Box ml={5}>
                    <Typography variant="h4" gutterBottom mt={2}>
                        Your Donations:
                    </Typography>
                </Box>
                
                <Box display="flex" justifyContent="space-between" mt={2} ml={5} mr={5}>
                    
                    <Box width="60%">
                        <Typography variant="h6" gutterBottom>Uncollected</Typography>
                        <Box bgcolor="error.main" p={2} borderRadius={2} maxHeight={330} overflow="auto">
                            {uncollectedDonations.length === 0 ? (
                                <Alert severity="info">You have no uncollected donations.</Alert>
                            ) : (
                                uncollectedDonations.flatMap((donation) =>
                                    donation.foods.map((food) => (
                                        <Card key={`${donation.id}-${food.id}`} sx={{ mb: 2, bgcolor: '' }}>
                                            <CardContent>
                                                <Box display="flex" justifyContent="space-between" alignItems="center">
                                                    {donation.image && (
                                                        <Box
                                                            sx={{
                                                                position: 'relative',
                                                                width: 80,
                                                                height: 80,
                                                                cursor: 'pointer',
                                                            }}
                                                            onClick={() => handleImageClick(`${backendRoute}${formatImagePath(donation.image)}`)}
                                                        >
                                                            <Box
                                                                sx={{
                                                                    width: '100%',
                                                                    height: '100%',
                                                                    backgroundImage: `url(${backendRoute}${formatImagePath(donation.image)})`,
                                                                    backgroundSize: 'cover',
                                                                    backgroundPosition: 'center',
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
                                                    )}

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

                        <Dialog open={goalAchievedDialogOpen} onClose={handleCloseGoalAchievedDialog}>
                            <DialogTitle>Congratulations!</DialogTitle>
                            <DialogContent>
                                <Typography>
                                    You have achieved your donation goal of {donationGoal} grams!
                                </Typography>
                                <Typography>
                                    Please set your next goal.
                                </Typography>
                            </DialogContent>
                            <DialogActions>
                                <Button onClick={handleCloseGoalAchievedDialog} color="primary">
                                    Close
                                </Button>
                            </DialogActions>
                        </Dialog>

                        <Typography variant="h6" gutterBottom mt={4}>Collected</Typography>
                        <Box bgcolor="success.main" p={2} borderRadius={2} maxHeight={330} overflow="auto" mb={10}>
                            {collectedDonations.length === 0 ? (
                                <Alert severity="info">You have no collected donations.</Alert>
                            ) : (
                                collectedDonations.flatMap((donation) =>
                                    donation.foods.map((food) => (
                                        <Card key={`${donation.id}-${food.id}`} sx={{ mb: 2, bgcolor: '' }}>
                                            <CardContent>
                                                <Box display="flex" justifyContent="space-between" alignItems="center">
                                                    {donation.image && (
                                                        <Box
                                                            sx={{
                                                                position: 'relative',
                                                                width: 80,
                                                                height: 80,
                                                                cursor: 'pointer',
                                                            }}
                                                            onClick={() => handleImageClick(`${backendRoute}${formatImagePath(donation.image)}`)}
                                                        >
                                                            <Box
                                                                sx={{
                                                                    width: '100%',
                                                                    height: '100%',
                                                                    backgroundImage: `url(${backendRoute}${formatImagePath(donation.image)})`,
                                                                    backgroundSize: 'cover',
                                                                    backgroundPosition: 'center',
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
                                                    )}

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
                    </Box>

                    <Box width="35%">
                        <Typography variant="h6" gutterBottom>Recent Reviews</Typography>
                        <Box bgcolor="grey.200" p={2} borderRadius={2} maxHeight={800} overflow="auto">
                            {reviews.length === 0 ? (
                                <Alert severity="info">You have no reviews yet.</Alert>
                            ) : (
                                <>
                                    <List>
                                        {reviews.slice(0, 5).map((review) => (
                                            <React.Fragment key={review.id}>
                                                <ListItem alignItems="flex-start">
                                                    <ListItemAvatar>
                                                        <Avatar>{getDisplayName(review)[0]}</Avatar>
                                                    </ListItemAvatar>
                                                    <ListItemText
                                                        primary={
                                                            <Box>
                                                                <Typography variant="subtitle1">
                                                                    {getDisplayName(review)}
                                                                </Typography>
                                                                <Rating
                                                                    name="read-only"
                                                                    value={review.rating}
                                                                    readOnly
                                                                    size="small"
                                                                />
                                                            </Box>
                                                        }
                                                        secondary={
                                                            <Typography
                                                                component="span"
                                                                variant="body2"
                                                                color="text.primary"
                                                                sx={{ display: 'inline', mt: 1 }}
                                                            >
                                                                {truncateMessage(review.comment)}
                                                            </Typography>
                                                        }
                                                    />
                                                </ListItem>
                                                <Divider variant="inset" component="li" />
                                            </React.Fragment>
                                        ))}
                                    </List>
                                    {reviews.length > 1 && (
                                        <Box textAlign="center" mt={2}>
                                            <Button
                                                component={Link}
                                                to={`/profile/${parseJwt(token).id}`}
                                                variant="outlined"
                                            >
                                                See More
                                            </Button>
                                        </Box>
                                    )}
                                </>
                            )}
                        </Box>
                    </Box>
                </Box>

            </div>
        </div>
    );
}
