import React, { useEffect, useState, useCallback, useContext } from 'react';
import { UserNavbar, DonatorNavbar } from './components/Navbar'
import { useParams } from 'react-router-dom';
import { format } from 'date-fns';
import { styled } from '@mui/material/styles';
import StarIcon from '@mui/icons-material/Star';
import {
    List,
    ListItem,
    ListItemText,
    ListItemAvatar,
    Typography,
    Paper,
    Container,
    IconButton,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    TextField,
    Rating,
    Snackbar,
    Box,
    Avatar,
    Divider,
    ButtonGroup,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import EditIcon from '@mui/icons-material/Edit';
import ReplyIcon from '@mui/icons-material/Reply';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import { TokenContext } from './utils/TokenContext';
import { UserFooter, DonatorFooter } from './components/Footer';
import parseJwt from './utils/parseJwt.jsx'
import { backendRoute } from './utils/BackendUrl.jsx'

// Styled components
const StyledContainer = styled(Container)(({ theme }) => ({
    backgroundColor: '#f5f5f5',
    fontFamily: 'Roboto, sans-serif',
    paddingTop: theme.spacing(3),
    paddingBottom: theme.spacing(3),
}));

const StyledPaper = styled(Paper)(({ theme }) => ({
    backgroundColor: '#ffffff',
    borderRadius: theme.shape.borderRadius,
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    padding: theme.spacing(3),
    marginBottom: theme.spacing(5),
}));

const StyledButtonGroup = styled(ButtonGroup)(({ theme }) => ({
    marginBottom: theme.spacing(3),
    '& .MuiButton-root': {
        textTransform: 'none',
        fontWeight: 400,
    },
}));

const StyledListItem = styled(ListItem)(({ theme }) => ({
    padding: theme.spacing(2, 0),
    '&:not(:last-child)': {
        borderBottom: `1px solid ${theme.palette.divider}`,
    },
}));

const StyledAvatar = styled(Avatar)(({ theme }) => ({
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
}));

const StyledRating = styled(Rating)(({ theme }) => ({
    marginTop: theme.spacing(1),
    '& .MuiRating-iconFilled': {
        color: '#ffb400',
    },
}));

const ImagePreview = styled(Box)(({ theme }) => ({
    display: 'inline-block',
    marginRight: theme.spacing(1),
    marginTop: theme.spacing(1.5),
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: theme.shape.borderRadius,
    overflow: 'hidden',
    transition: 'transform 0.2s',
    '&:hover': {
        transform: 'scale(1.05)',
    },
}));

const ReplySection = styled(Box)(({ theme }) => ({
    backgroundColor: theme.palette.grey[100],
    borderRadius: theme.shape.borderRadius,
    padding: theme.spacing(1.5),
    marginTop: theme.spacing(2),
}));

const StyledFooter = styled(Box)(({ theme }) => ({
    paddingTop: theme.spacing(3),
}));

export default function Profile() {
    const { token } = useContext(TokenContext);
    const userId = parseJwt(token).id
    const userRole = parseJwt(token).role
    const { donatorId } = useParams();
    const [reviews, setReviews] = useState([]);
    const [filteredReviews, setFilteredReviews] = useState([]);
    const [currentFilter, setCurrentFilter] = useState('all');
    const [likedReviews, setLikedReviews] = useState({});
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [reviewToDelete, setReviewToDelete] = useState(null);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [reviewToEdit, setReviewToEdit] = useState(null);
    const [donatorName, setDonatorName] = useState("Loading...");
    const [replyDialogOpen, setReplyDialogOpen] = useState(false);
    const [replyContent, setReplyContent] = useState('');
    const [reviewToReply, setReviewToReply] = useState(null);
    const [editReplyDialogOpen, setEditReplyDialogOpen] = useState(false);
    const [replyToEdit, setReplyToEdit] = useState(null);
    const [editedReplyContent, setEditedReplyContent] = useState('');
    const [enlargedImage, setEnlargedImage] = useState(null);
    const [deleteReplyDialogOpen, setDeleteReplyDialogOpen] = useState(false);
    const [replyToDelete, setReplyToDelete] = useState(null);


    const handleFilterChange = useCallback((filter) => {
        setCurrentFilter(filter);
        if (filter === 'all') {
            setFilteredReviews(reviews);
        } else {
            const rating = parseInt(filter);
            setFilteredReviews(reviews.filter(review => review.rating === rating));
        }
    }, [reviews]);

    const StyledRating = styled(Rating)({
        '& .MuiRating-iconFilled': {
            color: '#ffb400',
        },
        '& .MuiRating-iconHover': {
            color: '#ffb400',
        },
    });

    const handleThumbsUp = useCallback(async (reviewId) => {
        try {
            const response = await fetch(`${backendRoute}/reviews/${reviewId}/like`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ userId, userRole })
            });

            if (response.ok) {
                const { message, likeCount, liked } = await response.json();
                setReviews(prevReviews => prevReviews.map(review =>
                    review.id === reviewId
                        ? { ...review, likeCount: likeCount, likedByUser: liked }
                        : review
                ));
                setLikedReviews(prev => ({
                    ...prev,
                    [reviewId]: liked
                }));
                setSnackbar({ open: true, message: message, severity: 'success' });
            } else {
                const errorData = await response.json();
                console.error('Server error:', errorData);
                throw new Error(`Failed to update like: ${errorData.message}`);
            }
        } catch (error) {
            console.error('Error updating like:', error);
            console.error('Error details:', error.message);
            setSnackbar({ open: true, message: 'Failed to update like. Please try again.', severity: 'error' });
        }
    }, [token, userId, userRole, backendRoute]);


    const handleImageClick = (imageUrl) => {
        setEnlargedImage(imageUrl);
    };

    const handleCloseEnlargedImage = () => {
        setEnlargedImage(null);
    };

    const fetchDonatorName = useCallback(async () => {
        try {
            const response = await fetch(`${backendRoute}/get_donator`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ id: donatorId })
            });
            if (!response.ok) {
                throw new Error('Failed to fetch donator name');
            }
            const data = await response.json();
            setDonatorName(data.name);
        } catch (error) {
            console.error('Error fetching donator name:', error);
            setDonatorName("Unknown Donator");
        }
    }, [donatorId]);

    const fetchReviews = useCallback(async () => {
        console.log('Fetching reviews...');
        try {
            const response = await fetch(`${backendRoute}/reviews/${donatorId}?userId=${userId}&userRole=${userRole}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
            });
            if (!response.ok) {
                const errorBody = await response.text();
                console.error('Error response:', errorBody);
                throw new Error(`Failed to fetch reviews: ${response.status} ${response.statusText}`);
            }
            const data = await response.json();
            console.log('Reviews fetched:', data);
            setReviews(data);
            setFilteredReviews(data);
            const initialLikedReviews = {};
            data.forEach(review => {
                initialLikedReviews[review.id] = review.likedByUser || false;
            });
            setLikedReviews(initialLikedReviews);
        } catch (error) {
            console.error('Error fetching reviews:', error);
        }
    }, [donatorId, userId, userRole, token, backendRoute]);

    useEffect(() => {
        fetchReviews();
        fetchDonatorName();
    }, [fetchReviews, fetchDonatorName]);

    useEffect(() => {
        handleFilterChange(currentFilter);
    }, [reviews, currentFilter, handleFilterChange]);

    const handleDeleteClick = useCallback((reviewId) => {
        console.log('Delete clicked for review:', reviewId);
        setReviewToDelete(reviewId);
        setDeleteDialogOpen(true);
    }, []);

    const handleDeleteConfirm = useCallback(async () => {
        console.log('Delete confirmed for review:', reviewToDelete);
        if (reviewToDelete) {
            try {
                console.log('Sending delete request...');
                const response = await fetch(`${backendRoute}/reviews/${reviewToDelete}`, {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ userId: userId })
                });
    
                console.log('Delete response received:', response.status);
    
                if (response.ok) {
                    const result = await response.json();
                    console.log('Review deleted successfully:', result);
                    setReviews(prevReviews => prevReviews.filter(review => review.id !== reviewToDelete));
                    setSnackbar({ open: true, message: result.message, severity: 'success' });
                } else {
                    const errorData = await response.json();
                    console.error('Server error details:', errorData);
                    throw new Error(errorData.error || `Failed to delete review: ${response.status}`);
                }
            } catch (error) {
                console.error('Error during delete operation:', error);
                setSnackbar({ open: true, message: `Failed to delete review: ${error.message}`, severity: 'error' });
            } finally {
                setDeleteDialogOpen(false);
                setReviewToDelete(null);
                fetchReviews();
            }
        }
    }, [reviewToDelete, fetchReviews, userId, backendRoute]);
    
    const handleDeleteCancel = useCallback(() => {
        console.log('Delete cancelled');
        setDeleteDialogOpen(false);
        setReviewToDelete(null);
    }, []);

    const handleEditClick = useCallback((review) => {
        console.log('Edit clicked for review:', review.id);
        setReviewToEdit({ ...review });
        setEditDialogOpen(true);
    }, []);

    const handleEditConfirm = useCallback(async () => {
        console.log('Edit confirmed for review:', reviewToEdit);
        if (reviewToEdit && reviewToEdit.id) {
            try {
                console.log('Sending edit request...');
                const editUrl = `${backendRoute}/reviews/${reviewToEdit.id}`;
                console.log('Edit URL:', editUrl);

                const response = await fetch(editUrl, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        rating: reviewToEdit.rating,
                        comment: reviewToEdit.comment
                    }),
                });

                console.log('Edit response received:', response.status);

                if (response.ok) {
                    const updatedReview = await response.json();
                    console.log('Review edited successfully:', updatedReview);
                    fetchReviews();
                    setSnackbar({ open: true, message: 'Review updated successfully', severity: 'success' });
                } else {
                    const errorText = await response.text();
                    console.error('Server responded with an error:', response.status, errorText);
                    throw new Error(`Failed to edit review: ${response.status}`);
                }
            } catch (error) {
                console.error('Error during edit operation:', error);
                setSnackbar({ open: true, message: 'Failed to edit review. Please try again.', severity: 'error' });
            } finally {
                setEditDialogOpen(false);
                setReviewToEdit(null);
            }
        } else {
            console.error('Cannot edit review: reviewToEdit or its id is null');
            setSnackbar({ open: true, message: 'Cannot edit review: Invalid review data', severity: 'error' });
        }
    }, [reviewToEdit, fetchReviews]);

    const handleEditCancel = useCallback(() => {
        console.log('Edit cancelled');
        setEditDialogOpen(false);
        setReviewToEdit(null);
    }, []);

    const handleEditChange = useCallback((field, value) => {
        setReviewToEdit(prev => ({ ...prev, [field]: value }));
    }, []);

    const handleSnackbarClose = (event, reason) => {
        if (reason === 'clickaway') {
            return;
        }
        setSnackbar({ ...snackbar, open: false });
    };

    const getDisplayName = (review) => {
        if (review.isAnonymous) {
            const name = review.user?.person?.name || 'Unknown User';
            if (name.length > 1) {
                return `${name[0]}${'*'.repeat(8)}`;
            } else {
                return `${name[0]}${'*'.repeat(8)}`;
            }
        }
        return review.user?.person?.name || 'Unknown User';
    };

    const handleEditReplyClick = useCallback((reply) => {
        if (userRole === "donator" && parseInt(donatorId) === userId) {
            setReplyToEdit(reply);
            setEditedReplyContent(reply.content);
            setEditReplyDialogOpen(true);
        } else {
            setSnackbar({ open: true, message: 'You are not authorized to edit this reply.', severity: 'error' });
        }
    }, [userRole, donatorId, userId]);

    const handleEditReplyConfirm = useCallback(async () => {
        if (replyToEdit && editedReplyContent) {
            try {
                console.log('Updating reply:', `${backendRoute}/replies/${replyToEdit.id}`, editedReplyContent);
                const response = await fetch(`${backendRoute}/replies/${replyToEdit.id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        content: editedReplyContent
                    }),
                });

                if (response.ok) {
                    const updatedReply = await response.json();
                    fetchReviews();
                    setSnackbar({ open: true, message: 'Reply updated successfully', severity: 'success' });
                } else {
                    throw new Error('Failed to update reply');
                }
            } catch (error) {
                console.error('Error updating reply:', error);
                setSnackbar({ open: true, message: 'Failed to update reply. Please try again.', severity: 'error' });
            } finally {
                setEditReplyDialogOpen(false);
                setReplyToEdit(null);
                setEditedReplyContent('');
            }
        }
    }, [replyToEdit, editedReplyContent, fetchReviews]);

    const handleDeleteReply = useCallback((reply) => {
        if (userRole === "donator" && parseInt(donatorId) === userId) {
            setReplyToDelete(reply);
            setDeleteReplyDialogOpen(true);
        } else {
            setSnackbar({ open: true, message: 'You are not authorized to delete this reply.', severity: 'error' });
        }
    }, [userRole, donatorId, userId]);
    const confirmDeleteReply = useCallback(async () => {
        if (replyToDelete) {
            try {
                const response = await fetch(`${backendRoute}/replies/${replyToDelete.id}`, {
                    method: 'DELETE',
                });

                if (response.ok) {
                    fetchReviews();
                    setSnackbar({ open: true, message: 'Reply deleted successfully', severity: 'success' });
                } else {
                    throw new Error('Failed to delete reply');
                }
            } catch (error) {
                console.error('Error deleting reply:', error);
                setSnackbar({ open: true, message: 'Failed to delete reply. Please try again.', severity: 'error' });
            } finally {
                setDeleteReplyDialogOpen(false);
                setReplyToDelete(null);
            }
        }
    }, [replyToDelete, fetchReviews, backendRoute]);

    const handleReplyClick = useCallback((review) => {
        if (userRole === "donator" && parseInt(donatorId) === userId) {
            setReviewToReply(review);
            setReplyDialogOpen(true);
        } else {
            setSnackbar({ open: true, message: 'You are not authorized to reply to this review.', severity: 'error' });
        }
    }, [userRole, donatorId, userId]);

    const handleReplyConfirm = useCallback(async () => {
        if (reviewToReply && replyContent) {
            try {
                const response = await fetch(`${backendRoute}/reviews/${reviewToReply.id}/reply`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        content: replyContent,
                        donatorId: parseInt(donatorId)
                    }),
                });

                if (response.ok) {
                    const newReply = await response.json();
                    fetchReviews();
                    setSnackbar({ open: true, message: 'Reply added successfully', severity: 'success' });
                } else {
                    throw new Error('Failed to add reply');
                }
            } catch (error) {
                console.error('Error adding reply:', error);
                setSnackbar({ open: true, message: 'Failed to add reply. Please try again.', severity: 'error' });
            } finally {
                setReplyDialogOpen(false);
                setReplyContent('');
                setReviewToReply(null);
            }
        }
    }, [reviewToReply, replyContent, donatorId, fetchReviews]);

    const handleReplyCancel = useCallback(() => {
        setReplyDialogOpen(false);
        setReplyContent('');
        setReviewToReply(null);
    }, []);

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return format(date, 'dd/MM/yyyy HH:mm');
    };

    console.log('Rendering Profile component', { reviews, deleteDialogOpen, reviewToDelete, editDialogOpen, reviewToEdit });

    return (
        <>
            {userRole === 'donator' ? <DonatorNavbar /> : <UserNavbar />}
            <StyledContainer maxWidth="md">
                <StyledPaper elevation={3}>
                    <Typography variant="h4" gutterBottom sx={{ color: '#333', fontWeight: 500 }}>
                        {donatorName}'s Reviews
                        {userRole === "donator" && parseInt(donatorId) === userId && " (Myself)"}
                    </Typography>
                    <StyledButtonGroup variant="contained" aria-label="rating filter button group">
                        <Button
                            onClick={() => handleFilterChange('all')}
                            color={currentFilter === 'all' ? 'primary' : 'inherit'}
                        >
                            All
                        </Button>
                        {[5, 4, 3, 2, 1].map((rating) => (
                            <Button
                                key={rating}
                                onClick={() => handleFilterChange(rating.toString())}
                                color={currentFilter === rating.toString() ? 'primary' : 'inherit'}
                                startIcon={<StarIcon style={{ color: '#ffb400' }} />}
                            >
                                {rating}
                            </Button>
                        ))}
                    </StyledButtonGroup>
                    <List>
                        {filteredReviews.map((review) => (
                            <React.Fragment key={review.id}>
                                <StyledListItem alignItems="flex-start" component="div">
                                    <ListItemAvatar>
                                        <StyledAvatar>{getDisplayName(review)[0]}</StyledAvatar>
                                    </ListItemAvatar>
                                    <ListItemText
                                        primary={
                                            <Box>
                                                <Box display="flex" justifyContent="space-between" alignItems="center">
                                                    <Typography variant="subtitle1">{getDisplayName(review)}</Typography>
                                                    <Typography variant="caption">
                                                        Submitted on {formatDate(review.createdAt)}
                                                    </Typography>
                                                </Box>
                                                <StyledRating name="read-only" value={review.rating} readOnly size="small" />
                                            </Box>
                                        }
                                        secondary={
                                            <>
                                                <Typography variant="body2" color="textPrimary" sx={{ mt: 1.5, color: '#555' }}>
                                                    {review.comment}
                                                </Typography>
                                                {review.images && review.images.length > 0 && (
                                                    <Box sx={{ display: 'flex', mt: 2 }}>
                                                        {review.images.map((image, index) => (
                                                            <ImagePreview
                                                                key={index}
                                                                onClick={() => handleImageClick(`${backendRoute}/uploads/${image.url}`)}
                                                            >
                                                                <Box
                                                                    sx={{
                                                                        width: 80,
                                                                        height: 80,
                                                                        backgroundImage: `url(${backendRoute}/uploads/${image.url})`,
                                                                        backgroundSize: 'cover',
                                                                        backgroundPosition: 'center',
                                                                    }}
                                                                />
                                                            </ImagePreview>
                                                        ))}
                                                    </Box>
                                                )}
                                                {userRole === "donator" && parseInt(donatorId) === userId && !review.reply && (
                                                    <Button
                                                        size="small"
                                                        startIcon={<ReplyIcon />}
                                                        onClick={() => handleReplyClick(review)}
                                                        sx={{ mt: 1.5 }}
                                                    >
                                                        Reply
                                                    </Button>
                                                )}
                                                {review.reply && (
                                                    <ReplySection>
                                                        <Typography variant="subtitle2">Donator's Reply:</Typography>
                                                        <Typography variant="body2">{review.reply.content}</Typography>
                                                        <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                                                            Replied on {formatDate(review.reply.createdAt)}
                                                        </Typography>
                                                        {userRole === "donator" && parseInt(donatorId) === userId && (
                                                            <Box sx={{ display: 'flex', mt: 1, justifyContent: 'flex-end' }}>
                                                                <IconButton onClick={() => handleEditReplyClick(review.reply)} size="small">
                                                                    <EditIcon fontSize="small" />
                                                                </IconButton>
                                                                <IconButton onClick={() => handleDeleteReply(review.reply)} size="small">
                                                                    <DeleteIcon fontSize="small" />
                                                                </IconButton>
                                                            </Box>
                                                        )}
                                                    </ReplySection>
                                                )}
                                                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1.5 }}>
                                                    {userId === review.userId && (
                                                        <>
                                                            <IconButton size="small" onClick={() => handleEditClick(review)} sx={{ mr: 1 }}>
                                                                <EditIcon fontSize="small" />
                                                            </IconButton>
                                                            <IconButton size="small" onClick={() => handleDeleteClick(review.id)} sx={{ mr: 1 }}>
                                                                <DeleteIcon fontSize="small" />
                                                            </IconButton>
                                                        </>
                                                    )}
                                                    <IconButton
                                                        onClick={() => handleThumbsUp(review.id)}
                                                        size="small"
                                                        sx={{ mr: 1 }}
                                                    >
                                                        <ThumbUpIcon color={review.likedByUser ? 'primary' : 'inherit'} />
                                                    </IconButton>
                                                    <Typography variant="body2" sx={{ mr: 2 }}>
                                                        {review.likeCount} likes
                                                    </Typography>
                                                    {review.likedByDonator && (
                                                        <Typography variant="body2" color="primary">
                                                            Liked by donator
                                                        </Typography>
                                                    )}
                                                </Box>
                                            </>
                                        }
                                    />
                                </StyledListItem>
                            </React.Fragment>
                        ))}
                    </List>
                </StyledPaper>
    
                <Dialog
                    open={deleteDialogOpen}
                    onClose={() => setDeleteDialogOpen(false)}
                    aria-labelledby="delete-dialog-title"
                    aria-describedby="delete-dialog-description"
                >
                    <DialogTitle id="delete-dialog-title">{"Confirm Delete"}</DialogTitle>
                    <DialogContent>
                        <DialogContentText id="delete-dialog-description">
                            Are you sure you want to delete this review? This action cannot be undone.
                        </DialogContentText>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleDeleteConfirm} color="error" autoFocus>
                            Delete
                        </Button>
                    </DialogActions>
                </Dialog>
    
                <Dialog
                    open={editDialogOpen}
                    onClose={() => setEditDialogOpen(false)}
                    aria-labelledby="edit-dialog-title"
                    aria-describedby="edit-dialog-description"
                >
                    <DialogTitle id="edit-dialog-title">{"Edit Review"}</DialogTitle>
                    <DialogContent>
                        <Rating
                            name="rating"
                            value={reviewToEdit ? reviewToEdit.rating : 0}
                            onChange={(event, newValue) => setReviewToEdit(prev => ({ ...prev, rating: newValue }))}
                        />
                        <TextField
                            autoFocus
                            margin="dense"
                            id="comment"
                            label="Comment"
                            type="text"
                            fullWidth
                            multiline
                            rows={4}
                            value={reviewToEdit ? reviewToEdit.comment : ''}
                            onChange={(e) => setReviewToEdit(prev => ({ ...prev, comment: e.target.value }))}
                        />
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleEditConfirm} color="primary">
                            Save Changes
                        </Button>
                    </DialogActions>
                </Dialog>
    
                <Dialog
                    open={replyDialogOpen}
                    onClose={() => setReplyDialogOpen(false)}
                    aria-labelledby="reply-dialog-title"
                >
                    <DialogTitle id="reply-dialog-title">Reply to Review</DialogTitle>
                    <DialogContent>
                        <TextField
                            autoFocus
                            margin="dense"
                            id="reply"
                            label="Your Reply"
                            type="text"
                            fullWidth
                            multiline
                            rows={4}
                            value={replyContent}
                            onChange={(e) => setReplyContent(e.target.value)}
                        />
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setReplyDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleReplyConfirm} disabled={!replyContent.trim()}>
                            Submit Reply
                        </Button>
                    </DialogActions>
                </Dialog>
    
                <Dialog
                    open={editReplyDialogOpen}
                    onClose={() => setEditReplyDialogOpen(false)}
                    aria-labelledby="edit-reply-dialog-title"
                >
                    <DialogTitle id="edit-reply-dialog-title">Edit Reply</DialogTitle>
                    <DialogContent>
                        <TextField
                            autoFocus
                            margin="dense"
                            id="editedReply"
                            label="Your Edited Reply"
                            type="text"
                            fullWidth
                            multiline
                            rows={4}
                            value={editedReplyContent}
                            onChange={(e) => setEditedReplyContent(e.target.value)}
                        />
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setEditReplyDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleEditReplyConfirm} disabled={!editedReplyContent.trim()}>
                            Update Reply
                        </Button>
                    </DialogActions>
                </Dialog>
    
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
                    open={deleteReplyDialogOpen}
                    onClose={() => setDeleteReplyDialogOpen(false)}
                    aria-labelledby="delete-reply-dialog-title"
                    aria-describedby="delete-reply-dialog-description"
                >
                    <DialogTitle id="delete-reply-dialog-title">{"Confirm Delete Reply"}</DialogTitle>
                    <DialogContent>
                        <DialogContentText id="delete-reply-dialog-description">
                            Are you sure you want to delete this reply? This action cannot be undone.
                        </DialogContentText>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setDeleteReplyDialogOpen(false)}>Cancel</Button>
                        <Button onClick={confirmDeleteReply} color="error" autoFocus>
                            Delete
                        </Button>
                    </DialogActions>
                </Dialog>
    
                <Snackbar
                    open={snackbar.open}
                    autoHideDuration={6000}
                    onClose={() => setSnackbar({ ...snackbar, open: false })}
                    message={snackbar.message}
                />
            </StyledContainer>
            <StyledFooter>
                {userRole === 'donator' ? <DonatorFooter /> : <UserFooter />}
            </StyledFooter>
        </>
    );
}


