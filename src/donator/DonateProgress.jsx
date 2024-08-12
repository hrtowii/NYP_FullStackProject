import React, { useState, useEffect, useCallback, useContext } from 'react';
import { NavLink, useParams, Link } from 'react-router-dom';
import '../index.css';
import './DonatorLanding.css';
import "./DonateItem.css";
import { DonatorNavbar } from '../components/Navbar';
import { DonatorFooter } from '../components/Footer';
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
    Box,
    List,
    ListItem,
    ListItemText,
    ListItemAvatar,
    Divider,
    Grid,
    Chip,
} from '@mui/material';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import AssignmentIcon from '@mui/icons-material/Assignment';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import AddIcon from '@mui/icons-material/Add';
import EventIcon from '@mui/icons-material/Event';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ScaleIcon from '@mui/icons-material/Scale';
import parseJwt from '../utils/parseJwt.jsx'

const DonationCard = ({ donation, food, handleImageClick, backendRoute, formatImagePath, formatDate }) => {
    const isReserved = donation.reservations && donation.reservations.length > 0;

    return (
        <Card elevation={3} sx={{ mb: 2, borderRadius: 2, overflow: 'visible' }}>
            <CardContent>
                <Grid container spacing={2} alignItems="flex-start">
                    <Grid item>
                        {donation.image && (
                            <Box
                                sx={{
                                    position: 'relative',
                                    width: 120,
                                    height: 120,
                                    cursor: 'pointer',
                                    borderRadius: 2,
                                    overflow: 'hidden',
                                }}
                                onClick={() => handleImageClick(`${backendRoute}${formatImagePath(donation.image)}`)}
                            >
                                <Box
                                    sx={{
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        width: '100%',
                                        height: '100%',
                                        backgroundImage: `url(${backendRoute}${formatImagePath(donation.image)})`,
                                        backgroundSize: 'cover',
                                        backgroundPosition: 'center',
                                    }}
                                />
                                <Box
                                    sx={{
                                        position: 'absolute',
                                        bottom: 8,
                                        right: 8,
                                        backgroundColor: 'rgba(255, 255, 255, 0.7)',
                                        borderRadius: '50%',
                                        padding: 0.5,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}
                                >
                                    <ZoomInIcon />
                                </Box>
                            </Box>
                        )}
                    </Grid>
                    <Grid item xs>
                        <Box>
                            <Typography
                                variant="h5"
                                gutterBottom
                                sx={{
                                    fontWeight: 'bold',
                                    fontSize: '1.5rem',
                                    mb: 2
                                }}
                            >
                                {food.name}
                            </Typography>
                            <Box display="flex" flexWrap="wrap" gap={1} mb={1}>
                                <Chip icon={<ScaleIcon />} label={`${food.quantity} g`} size="small" color="primary" />
                                <Chip
                                    icon={<EventIcon />}
                                    label={isReserved ? formatDate(donation.reservations[0].collectionDate) : "Unreserved"}
                                    size="small"
                                />
                                <Chip
                                    icon={<AccessTimeIcon />}
                                    label={isReserved ? `${donation.reservations[0].collectionTimeStart} - ${donation.reservations[0].collectionTimeEnd}` : "Unreserved"}
                                    size="small"
                                />
                            </Box>
                            <Typography variant="body2" color="text.secondary">
                                Status: {isReserved ? donation.reservations[0].collectionStatus : "Unreserved"}
                            </Typography>
                        </Box>
                    </Grid>
                </Grid>
            </CardContent>
        </Card>
    );
};

const DonationSection = ({ title, donations, handleImageClick, backendRoute, formatImagePath, formatDate, bgColor }) => (
    <Box mb={4}>
        <Typography variant="h5" gutterBottom>
            {title}
        </Typography>
        <Box bgcolor={bgColor} p={2} borderRadius={2} maxHeight={360} overflow="auto">
            {donations.length === 0 ? (
                <Alert severity="info">You have no {title.toLowerCase()} donations.</Alert>
            ) : (
                donations.flatMap((donation) =>
                    donation.foods.map((food) => (
                        <DonationCard
                            key={`${donation.id}-${food.id}`}
                            donation={donation}
                            food={food}
                            handleImageClick={handleImageClick}
                            backendRoute={backendRoute}
                            formatImagePath={formatImagePath}
                            formatDate={formatDate}
                        />
                    ))
                )
            )}
        </Box>
    </Box>
);

export default function DonateItem() {
    const [donations, setDonations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { token, updateToken } = useContext(TokenContext);
    const { donatorId } = useParams();
    const [reviews, setReviews] = useState([]);
    const [donationGoal, setDonationGoal] = useState(1000);
    const [totalDonations, setTotalDonations] = useState(0);
    const [previousTotalDonations, setPreviousTotalDonations] = useState(0);
    const [openGoalModal, setOpenGoalModal] = useState(false);
    const [goalInput, setGoalInput] = useState('');
    const [goalError, setGoalError] = useState(null);
    const [achievement, setAchievement] = useState('');
    const [goalAchieved, setGoalAchieved] = useState(false);
    const [goalAchievedDialogOpen, setGoalAchievedDialogOpen] = useState(false);
    const [enlargedImage, setEnlargedImage] = useState(null);
    const [collectedDonations, setCollectedDonations] = useState([]);
    const [reservedDonations, setReservedDonations] = useState([]);
    const [unreservedDonations, setUnreservedDonations] = useState([]);
    const [openSetInitialGoalModal, setOpenSetInitialGoalModal] = useState(false);
    const hasDonations = collectedDonations.length > 0 || reservedDonations.length > 0 || unreservedDonations.length > 0;

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

            const collected = [];
            const reserved = [];
            const unreserved = [];

            data.donations.forEach(donation => {
                if (donation.reservations && donation.reservations.length > 0) {
                    if (donation.reservations[0].collectionStatus === 'Collected') {
                        collected.push(donation);
                    } else {
                        reserved.push(donation);
                    }
                } else {
                    unreserved.push(donation);
                }
            });

            setCollectedDonations(collected);
            setReservedDonations(reserved);
            setUnreservedDonations(unreserved);
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
    }, [token]);

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
            console.log("Your donation goal = " + data.donationGoal);
            if (data.donationGoal === 0 || data.donationGoal === null) {
                setOpenSetInitialGoalModal(true);
            } else {
                setDonationGoal(data.donationGoal);
                setGoalInput(data.donationGoal);
            }
        } catch (error) {
            console.error('Error fetching donation goal:', error);
            setError('Failed to fetch donation goal. Please try again later.');
        }
    }, [token, backendRoute]);

    const handleSetInitialGoal = async () => {
        try {
            await handleDonationGoal();
            setOpenSetInitialGoalModal(false);
        } catch (error) {
            console.error('Error setting initial goal:', error);
            setGoalError(error.message || 'Failed to set initial donation goal. Please try again.');
        }
    };


    const determineAchievement = useCallback((totalQuantity) => {
        if (totalQuantity >= 10000) return 'Supreme';
        if (totalQuantity >= 5000) return 'Diamond';
        if (totalQuantity >= 1000) return 'Gold';
        return 'Silver';
    }, []);

    const updateAchievement = useCallback(async (newAchievement) => {
        const donatorId = parseJwt(token).id;
        if (!donatorId) {
            setError('No donator ID provided');
            return;
        }

        try {
            const response = await fetch(`${backendRoute}/donators/${donatorId}/achievement`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ achievement: newAchievement }),
            });

            if (!response.ok) {
                throw new Error('Failed to update achievement');
            }

            const data = await response.json();
            console.log('Achievement updated successfully:', data);
            setAchievement(newAchievement);
        } catch (error) {
            console.error('Error updating achievement:', error);
            setError('Failed to update achievement. Please try again later.');
        }
    }, [token, backendRoute, setError]);

    const handleDonationGoal = async () => {
        const donatorId = parseJwt(token).id;
        if (!donatorId) {
            throw new Error('No donator ID provided');
        }
        const goal = parseInt(goalInput);
        if (isNaN(goal) || goal <= 0) {
            throw new Error('Please enter a valid goal greater than 0');
        }
        if (goal <= totalDonations) {
            throw new Error('New goal must be greater than current total donations');
        }
        try {
            console.log(`Sending request to update goal: ${goal} for donator: ${donatorId}`);
            const response = await fetch(`${backendRoute}/donators/${donatorId}/goal`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ donationGoal: goal }),
            });

            if (!response.ok) {
                throw new Error(`Failed to update donation goal: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            console.log('Response from server:', data);
            setDonationGoal(goal);
            setGoalError(null);
            setGoalAchieved(false);
        } catch (error) {
            console.error('Error updating donation goal:', error);
            throw error;
        }
    };

    useEffect(() => {
        fetchDonations();
        fetchReviews();
        fetchTotalDonations();
        fetchInitialGoal();
    }, [fetchDonations, fetchReviews, fetchTotalDonations, fetchInitialGoal]);

    useEffect(() => {
        const newAchievement = determineAchievement(totalDonations);
        if (newAchievement !== achievement) {
            updateAchievement(newAchievement);
        }
    }, [totalDonations, achievement, determineAchievement, updateAchievement]);

    useEffect(() => {
        if (totalDonations >= donationGoal) {
            console.log('Goal achieved!');
            // We don't need to set any state here anymore
        }
        setPreviousTotalDonations(totalDonations);
    }, [totalDonations, donationGoal, previousTotalDonations]);

    const handleOpenGoalModal = () => {
        setOpenGoalModal(true);
    };

    const handleCloseGoalModal = () => {
        setOpenGoalModal(false);
    };

    const handleGoalChange = (event) => {
        setGoalInput(event.target.value);
    };

    const handleGoalSubmit = async () => {
        try {
            await handleDonationGoal();
            console.log('Goal updated successfully');

            // Fetch the updated goal from the server
            const donatorId = parseJwt(token).id;
            const response = await fetch(`${backendRoute}/donators/${donatorId}/goal`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            if (!response.ok) {
                throw new Error('Failed to fetch updated donation goal');
            }
            const data = await response.json();
            console.log('Fetched updated goal from server:', data.donationGoal);

            setDonationGoal(data.donationGoal);
            setOpenGoalModal(false);
        } catch (error) {
            console.error('Error submitting new goal:', error);
            setGoalError(error.message || 'Failed to update donation goal. Please try again.');
        }
    };

    const handleCloseEnlargedImage = () => {
        setEnlargedImage(null);
    };

    const handleImageClick = (imageUrl) => {
        setEnlargedImage(imageUrl);
    };

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

    const formatDate = (dateString) => {
        if (!dateString) return "Unreserved";
        const date = new Date(dateString);
        return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    };

    const formatImagePath = (path) => {
        if (!path) return '';
        const formattedPath = `${backendRoute}/${path.replace(/\\/g, '/').replace(/^public/, '')}`;
        return path.replace(/\\/g, '/').replace(/^public/, '');
    };

    const achievements = [
        { name: 'Silver', description: 'Donated less than 1000 grams' },
        { name: 'Gold', description: 'Donated more than 1000 grams' },
        { name: 'Diamond', description: 'Donated more than 5000 grams' },
        { name: 'Supreme', description: 'Donated 10000 grams or more' },
    ];

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

    return (
        <div className="container">
            <DonatorNavbar />
            <div className='contents' style={{ backgroundColor: '#f0f8f1' }}>
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

                <Box sx={{ backgroundColor: 'lightgrey' }} p={2} marginLeft={3} marginRight={3} paddingBottom={4} borderRadius={3}>
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
                                            color: achievement === achievementItem.name ? 'black' : 'black',
                                        }}
                                    >
                                        <CardContent>
                                            <Typography variant="h6">{achievementItem.name}</Typography>
                                            <Typography variant="body2" color={"black"}>{achievementItem.description}</Typography>
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
                                sx={{
                                    border: '2px solid black',
                                    borderRadius: 8,
                                }}>

                                <Box
                                    sx={{
                                        position: 'relative',
                                        height: 15,
                                        borderRadius: 8,
                                        border: '3x solid white',
                                        backgroundColor: 'white',
                                        padding: 0.3
                                    }}
                                >
                                    <LinearProgress
                                        variant="determinate"
                                        value={Math.min((totalDonations / donationGoal) * 100, 100)}
                                        sx={{
                                            height: '100%',
                                            borderRadius: 'inherit',
                                            backgroundColor: 'transparent',
                                            '& .MuiLinearProgress-bar': {
                                                backgroundColor: '#4caf50',
                                                borderRadius: 8,
                                            },
                                        }}
                                    />
                                </Box>
                            </Box>
                            <Box display="flex" justifyContent="space-between" alignItems="center" mt={2}>
                                <Typography variant="body1">
                                    {`Total Donations: ${totalDonations}g / Goal: ${donationGoal}g`}
                                </Typography>
                                {totalDonations >= donationGoal && (
                                    <Typography variant="body2" color="primary">
                                        Goal achieved! Set a new goal?
                                    </Typography>
                                )}
                            </Box>
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
                        {hasDonations ? (
                            <>
                                <DonationSection
                                    title="Unreserved Donations"
                                    donations={unreservedDonations}
                                    handleImageClick={handleImageClick}
                                    backendRoute={backendRoute}
                                    formatImagePath={formatImagePath}
                                    formatDate={formatDate}
                                    bgColor="error.light"
                                />
                                <DonationSection
                                    title="Reserved Donations"
                                    donations={reservedDonations}
                                    handleImageClick={handleImageClick}
                                    backendRoute={backendRoute}
                                    formatImagePath={formatImagePath}
                                    formatDate={formatDate}
                                    bgColor="warning.light"
                                />
                                <DonationSection
                                    title="Collected Donations"
                                    donations={collectedDonations}
                                    handleImageClick={handleImageClick}
                                    backendRoute={backendRoute}
                                    formatImagePath={formatImagePath}
                                    formatDate={formatDate}
                                    bgColor="success.light"
                                />
                            </>
                        ) : (
                            <Box textAlign="center" mt={2} mb={4} p={4} sx={{bgcolor:'#EEEEEE', borderRadius:4}}>
                                <Typography variant="h6" gutterBottom>
                                    You don't have any donations yet.
                                </Typography>
                                <Typography variant="body1" gutterBottom>
                                    Would you like to make your first donation?
                                </Typography>
                                <Button
                                    component={Link}
                                    to="/donator/DonateItem"
                                    variant="contained"
                                    color="primary"
                                    startIcon={<AddIcon />}
                                    sx={{ mt: 2 }}
                                >
                                    Make a New Donation
                                </Button>
                            </Box>
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
                                    {reviews.length > 0 && (
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
            <DonatorFooter />
        </div>
    );
}
