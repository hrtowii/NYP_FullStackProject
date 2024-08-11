import React, { useState, useEffect, useCallback, useContext, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import './index.css';
import { UserNavbar, DonatorNavbar } from './components/Navbar'
import { UserFooter, DonatorFooter } from './components/Footer';
import { backendRoute } from './utils/BackendUrl';
import { TokenContext } from './utils/TokenContext';
import parseJwt from './utils/parseJwt.jsx'
import {
    Button,
    Box,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Avatar,
    Rating,
    Alert,
    Modal,
    TextField,
    Snackbar,
    TableSortLabel,
    Switch,
    FormControlLabel,
    IconButton,
    ToggleButton,
    ToggleButtonGroup,
    Chip,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import CancelIcon from '@mui/icons-material/Cancel';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import { Leaf, Recycle, Globe } from 'lucide-react';

const SustainabilityDonatorBanner = () => {
    return (
        <Paper
            elevation={3}
            sx={{
                background: 'linear-gradient(90deg, #2ecc71, #27ae60)',
                color: 'white',
                padding: 3,
                marginBottom: 4,
                position: 'relative',
                overflow: 'hidden'
            }}
        >
            <Box sx={{ position: 'relative', zIndex: 1 }}>
                <Typography variant="h4" gutterBottom align="center" sx={{ fontWeight: 'bold' }}>
                    Our Eco-Conscious Donators
                </Typography>
                <Typography variant="subtitle1" align="center">
                    Together, we're nurturing a greener future
                </Typography>
            </Box>

            <Box sx={{
                position: 'absolute',
                top: -20,
                left: -20,
                opacity: 0.2,
                transform: 'rotate(-15deg)'
            }}>
                <Leaf size={100} />
            </Box>

            <Box sx={{
                position: 'absolute',
                bottom: -20,
                right: -20,
                opacity: 0.2,
                transform: 'rotate(15deg)'
            }}>
                <Recycle size={100} />
            </Box>

            <Box sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                opacity: 0.1,
                transform: 'translate(-50%, -50%)'
            }}>
                <Globe size={150} />
            </Box>
        </Paper>
    );
};

export default function ListOfDonators() {
    const [error, setError] = useState(null);
    const [profiles, setProfiles] = useState([]);
    const [openModal, setOpenModal] = useState(false);
    const [selectedDonator, setSelectedDonator] = useState(null);
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const [order, setOrder] = useState('asc');
    const [orderBy, setOrderBy] = useState('name');
    const [searchQuery, setSearchQuery] = useState('');
    const navigate = useNavigate();
    const { token } = useContext(TokenContext);
    const [ratingError, setRatingError] = useState(false);
    const [isAnonymous, setIsAnonymous] = useState(false);
    const [selectedImages, setSelectedImages] = useState([]);
    const [view, setView] = useState('list');


    const currentUserRole = parseJwt(token).role
    const currentUserId = parseJwt(token).id
    const currentUserName = parseJwt(token).name;
    const userId = parseJwt(token).id;


    const handleImageSelect = (event) => {
        const files = Array.from(event.target.files);
        if (files.length > 2) {
            setSnackbar({ open: true, message: 'You can only upload up to 1 images', severity: 'error' });
            return;
        }
        setSelectedImages(files);
    };

    const handleSearchChange = (event) => {
        setSearchQuery(event.target.value);
    };


    const getAchievementColor = (achievement) => {
        switch (achievement) {
            case 'Silver': return 'default';
            case 'Gold': return 'warning';
            case 'Diamond': return 'info';
            case 'Supreme': return 'success';
            default: return 'default';
        }
    };

    function stringToColor(string) {
        let hash = 0;
        for (let i = 0; i < string.length; i++) {
            hash = string.charCodeAt(i) + ((hash << 5) - hash);
        }
        let color = '#';
        for (let i = 0; i < 3; i++) {
            const value = (hash >> (i * 8)) & 0xFF;
            color += ('00' + value.toString(16)).substr(-2);
        }
        return color;
    }

    const getDisplayName = (name, isAnonymous) => {
        if (isAnonymous) {
            return `${name[0]}${'*'.repeat(8)}`;
        }
        return name;
    };

    const handleRemoveImage = (index) => {
        setSelectedImages(prevImages => prevImages.filter((_, i) => i !== index));
    };

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
            console.log('Profiles received from backend:', JSON.stringify(data, null, 2));
            if (data.length === 0) {
                setError('No users found in the database');
            } else {
                setProfiles(data);
            }
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

    const handleViewReviews = (donatorId) => {
        navigate(`/profile/${donatorId}`);
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
            formData.append('userId', currentUserId);
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
            handleCloseModal();
            fetchProfiles();
        } catch (error) {
            console.error('Error submitting review:', error);
            setSnackbar({ open: true, message: `Failed to submit review: ${error.message}`, severity: 'error' });
        }
    };

    const handleCloseModal = () => {
        setOpenModal(false);
        setSelectedDonator(null);
        setRating(0);
        setComment('');
        setRatingError(false);
        setIsAnonymous(false);
        setSelectedImages([]);
    };

    const handleRequestSort = (property) => {
        const isAsc = orderBy === property && order === 'asc';
        setOrder(isAsc ? 'desc' : 'asc');
        setOrderBy(property);
    };

    const sortedAndFilteredProfiles = useMemo(() => {
        const comparator = (a, b) => {
            if (orderBy === 'name') {
                return order === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
            } else if (orderBy === 'averageRating') {
                const aRating = a.donator?.averageRating || 0;
                const bRating = b.donator?.averageRating || 0;
                return order === 'asc' ? aRating - bRating : bRating - aRating;
            } else if (orderBy === 'reviewCount') {
                const aCount = a.donator?.reviewCount || 0;
                const bCount = b.donator?.reviewCount || 0;
                return order === 'asc' ? aCount - bCount : bCount - aCount;
            } else if (orderBy === 'achievement') {
                const achievementRank = { 'Silver': 1, 'Gold': 2, 'Diamond': 3, 'Supreme': 4 };
                const aRank = achievementRank[a.donator?.achievement] || 0;
                const bRank = achievementRank[b.donator?.achievement] || 0;
                return order === 'asc' ? aRank - bRank : bRank - aRank;
            }
            return 0;
        };

        return [...profiles]
            .sort(comparator)
            .filter(profile => profile.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }, [profiles, order, orderBy, searchQuery]);

    const handleViewChange = (event, newView) => {
        if (newView !== null) {
            setView(newView);
        }
    };

    const leaderboardData = useMemo(() => {
        return [...profiles]
            .sort((a, b) => (b.donator?.averageRating || 0) - (a.donator?.averageRating || 0))
            .slice(0, 10);
    }, [profiles]);
    const renderLeaderboard = () => (
        <TableContainer component={Paper}>
            <Table sx={{ minWidth: 650 }} aria-label="leaderboard table">
                <TableHead>
                    <TableRow sx={{ backgroundColor: 'action.hover' }}>
                        <TableCell>Rank</TableCell>
                        <TableCell>Name</TableCell>
                        <TableCell align="center">Average Rating</TableCell>
                        <TableCell align="center">Number of Reviews</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {leaderboardData.map((profile, index) => (
                        <TableRow
                            key={profile.id}
                            sx={{
                                '&:last-child td, &:last-child th': { border: 0 },
                                backgroundColor: index % 2 === 0 ? 'inherit' : 'action.hover'
                            }}
                        >
                            <TableCell>
                                {index + 1}
                                {index < 3 && <EmojiEventsIcon sx={{ ml: 1, color: ['gold', 'silver', 'bronze'][index] }} />}
                            </TableCell>
                            <TableCell component="th" scope="row">
                                <Box display="flex" alignItems="center">
                                    <Avatar sx={{ mr: 2, bgcolor: stringToColor(profile.name) }}>{profile.name[0]}</Avatar>

                                    <Typography color={"blue"}>
                                        {profile.name}
                                        {profile.id === userId && " (You)"}
                                    </Typography>

                                </Box>
                            </TableCell>
                            <TableCell align="center">
                                <Box display="flex" alignItems="center" justifyContent="center">
                                    <Rating value={Number(profile.donator.averageRating?.toFixed(1)) || 0} readOnly size="small" />
                                    <Typography variant="body2" sx={{ ml: 1 }}>
                                        ({profile.donator.averageRating?.toFixed(1) || 'N/A'})
                                    </Typography>
                                </Box>
                            </TableCell>
                            <TableCell align="center">{profile.donator.reviewCount || 'N/A'}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );

    return (
        <>
            {currentUserRole === 'donator' ? <DonatorNavbar /> : <UserNavbar />}
            <div className="container">
                <Box sx={{ p: 3, bgcolor: '#f0f8f1' }}> {/* Light green background */}
                    <SustainabilityDonatorBanner />
                    <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
                        <ToggleButtonGroup
                            value={view}
                            exclusive
                            onChange={handleViewChange}
                            aria-label="view selector"
                        >
                            <ToggleButton value="list" aria-label="list view">
                                View All
                            </ToggleButton>
                            <ToggleButton value="leaderboard" aria-label="leaderboard view">
                                Leaderboard
                            </ToggleButton>
                        </ToggleButtonGroup>
                    </Box>
                    {view === 'list' && (
                        <>
                            <Box sx={{ mb: 3, width: '100%' }}>
                                <TextField
                                    fullWidth
                                    variant="outlined"
                                    size="small"
                                    placeholder="Search donators by name..."
                                    value={searchQuery}
                                    onChange={handleSearchChange}
                                    InputProps={{
                                        startAdornment: <SearchIcon sx={{ color: 'action.active', mr: 1 }} />,
                                        endAdornment: searchQuery && (
                                            <IconButton size="small" onClick={() => setSearchQuery('')}>
                                                <CancelIcon />
                                            </IconButton>
                                        ),
                                    }}
                                />
                            </Box>
                            {error ? (
                                <Box display="flex" justifyContent="center" alignItems="center" minHeight="calc(100vh - 200px)">
                                    <Alert severity="info">{error}</Alert>
                                </Box>
                            ) : (
                                <TableContainer component={Paper}>
                                    <Table sx={{ minWidth: 650 }} aria-label="donators table">
                                        <TableHead>
                                            <TableRow sx={{ backgroundColor: 'action.hover' }}>
                                                <TableCell>#</TableCell>
                                                <TableCell>
                                                    <TableSortLabel
                                                        active={orderBy === 'name'}
                                                        direction={orderBy === 'name' ? order : 'asc'}
                                                        onClick={() => handleRequestSort('name')}
                                                    >
                                                        Name
                                                    </TableSortLabel>
                                                </TableCell>
                                                <TableCell align="center">
                                                    <TableSortLabel
                                                        active={orderBy === 'averageRating'}
                                                        direction={orderBy === 'averageRating' ? order : 'asc'}
                                                        onClick={() => handleRequestSort('averageRating')}
                                                    >
                                                        Average Rating
                                                    </TableSortLabel>
                                                </TableCell>
                                                <TableCell align="center">
                                                    <TableSortLabel
                                                        active={orderBy === 'reviewCount'}
                                                        direction={orderBy === 'reviewCount' ? order : 'asc'}
                                                        onClick={() => handleRequestSort('reviewCount')}
                                                    >
                                                        Number of Reviews
                                                    </TableSortLabel>
                                                </TableCell>
                                                <TableCell align="center">
                                                    <TableSortLabel
                                                        active={orderBy === 'achievement'}
                                                        direction={orderBy === 'achievement' ? order : 'asc'}
                                                        onClick={() => handleRequestSort('achievement')}
                                                    >
                                                        Rank
                                                    </TableSortLabel>
                                                </TableCell>
                                                <TableCell align="right">Actions</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {sortedAndFilteredProfiles.map((profile, index) => (
                                                <TableRow
                                                    key={profile.id}
                                                    sx={{
                                                        '&:last-child td, &:last-child th': { border: 0 },
                                                        backgroundColor: index % 2 === 0 ? 'inherit' : 'action.hover'
                                                    }}
                                                >
                                                    <TableCell>{index + 1}</TableCell>
                                                    <TableCell component="th" scope="row">
                                                        <Box display="flex" alignItems="center">
                                                            <Avatar sx={{ mr: 2, bgcolor: stringToColor(profile.name) }}>{profile.name[0]}</Avatar>
                                                            {profile.name}
                                                            {profile.id === userId && " (You)"}
                                                        </Box>
                                                    </TableCell>
                                                    <TableCell align="center">
                                                        <Box display="flex" alignItems="center" justifyContent="center">
                                                            <Rating value={Number(profile.donator.averageRating?.toFixed(1)) || 0} readOnly size="small" />
                                                            <Typography variant="body2" sx={{ ml: 1 }}>
                                                                ({profile.donator.averageRating?.toFixed(1) || 'N/A'})
                                                            </Typography>
                                                        </Box>
                                                    </TableCell>
                                                    <TableCell align="center">{profile.donator.reviewCount || 'N/A'}</TableCell>
                                                    <TableCell align="center">
                                                        <Chip
                                                            label={profile.donator.achievement || 'N/A'}
                                                            color={getAchievementColor(profile.donator.achievement)}
                                                            size="small"
                                                        />
                                                    </TableCell>
                                                    <TableCell align="right">
                                                        {currentUserRole != "donator" &&
                                                            <Button
                                                                variant="contained"
                                                                color="primary"
                                                                size="small"
                                                                sx={{ mr: 1 }}
                                                                onClick={() => handleOpenModal(profile)}
                                                            >
                                                                Add Review
                                                            </Button>}
                                                        <Button
                                                            variant="outlined"
                                                            color="primary"
                                                            size="small"
                                                            onClick={() => handleViewReviews(profile.id)}
                                                        >
                                                            View Reviews
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            )}
                        </>
                    )}
                    {view === 'leaderboard' && (
                        <TableContainer component={Paper}>
                            <Table sx={{ minWidth: 650 }} aria-label="leaderboard table">
                                <TableHead>
                                    <TableRow sx={{ backgroundColor: 'action.hover' }}>
                                        <TableCell>Rank</TableCell>
                                        <TableCell>Name</TableCell>
                                        <TableCell align="center">Average Rating</TableCell>
                                        <TableCell align="center">Number of Reviews</TableCell>
                                        <TableCell align="center">Rank</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {leaderboardData.map((profile, index) => (
                                        <TableRow
                                            key={profile.id}
                                            sx={{
                                                '&:last-child td, &:last-child th': { border: 0 },
                                                backgroundColor: index % 2 === 0 ? 'inherit' : 'action.hover'
                                            }}
                                        >
                                            <TableCell>
                                                {index + 1}
                                                {index < 3 && <EmojiEventsIcon sx={{ ml: 1, color: ['gold', 'silver', 'bronze'][index] }} />}
                                            </TableCell>
                                            <TableCell component="th" scope="row">
                                                <Box display="flex" alignItems="center">
                                                    <Avatar sx={{ mr: 2, bgcolor: stringToColor(profile.name) }}>{profile.name[0]}</Avatar>
                                                    {profile.name}
                                                    {profile.id === userId && " (You)"}
                                                </Box>
                                            </TableCell>
                                            <TableCell align="center">
                                                <Box display="flex" alignItems="center" justifyContent="center">
                                                    <Rating value={Number(profile.donator.averageRating?.toFixed(1)) || 0} readOnly size="small" />
                                                    <Typography variant="body2" sx={{ ml: 1 }}>
                                                        ({profile.donator.averageRating?.toFixed(1) || 'N/A'})
                                                    </Typography>
                                                </Box>
                                            </TableCell>
                                            <TableCell align="center">{profile.donator.reviewCount || 'N/A'}</TableCell>
                                            <TableCell align="center">
                                                <Chip
                                                    label={profile.donator.achievement || 'N/A'}
                                                    color={getAchievementColor(profile.donator.achievement)}
                                                    size="small"
                                                />
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}
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
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                >
                    <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%' }}>
                        {snackbar.message}
                    </Alert>
                </Snackbar>
            </div>
            <UserFooter />
        </>
    );
}