import React, { useEffect, useState, useCallback, useContext } from 'react';
import { UserNavbar } from './components/Navbar'
import { useParams } from 'react-router-dom';
import { format } from 'date-fns';
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
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import EditIcon from '@mui/icons-material/Edit';
import ReplyIcon from '@mui/icons-material/Reply';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import { TokenContext } from './utils/TokenContext';
import parseJwt from './utils/parseJwt.jsx'
import { backendRoute } from './utils/BackendUrl.jsx'

export default function Profile() {
    const { token } = useContext(TokenContext);
    const userId = parseJwt(token).id
    const userRole = parseJwt(token).role
    const { donatorId } = useParams();
    const [reviews, setReviews] = useState([]);
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

    const handleThumbsUp = useCallback(async (reviewId) => {
        try {
            const response = await fetch(`${backendRoute}/reviews/${reviewId}/like`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ userId })
            });

            if (response.ok) {
                const { message, likeCount, liked } = await response.json();
                setReviews(prevReviews => prevReviews.map(review =>
                    review.id === reviewId
                        ? { ...review, likeCount: likeCount }
                        : review
                ));
                setLikedReviews(prev => ({
                    ...prev,
                    [reviewId]: liked
                }));
                setSnackbar({ open: true, message: message, severity: 'success' });
            } else {
                throw new Error('Failed to update like');
            }
        } catch (error) {
            console.error('Error updating like:', error);
            setSnackbar({ open: true, message: 'Failed to update like. Please try again.', severity: 'error' });
        }
    }, [token, userId, backendRoute]);

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
            const response = await fetch(`${backendRoute}/reviews/${donatorId}?userId=${userId}`, {
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
            // Initialize likedReviews state based on fetched data
            const initialLikedReviews = {};
            data.forEach(review => {
                initialLikedReviews[review.id] = review.liked || false;
            });
            setLikedReviews(initialLikedReviews);
        } catch (error) {
            console.error('Error fetching reviews:', error);
        }
    }, [donatorId, userId, token, backendRoute]);

    useEffect(() => {
        fetchReviews();
        fetchDonatorName();
    }, [fetchReviews, fetchDonatorName]);

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
                    console.log('Review deleted successfully');
                    setReviews(prevReviews => prevReviews.filter(review => review.id !== reviewToDelete));
                    setSnackbar({ open: true, message: 'Review deleted successfully', severity: 'success' });
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
            <UserNavbar />
            <Container maxWidth="md">
                <Paper elevation={3} style={{ padding: '20px', marginTop: '20px' }}>
                    <Typography variant="h4" gutterBottom>
                        {donatorName}'s Reviews
                        {userRole === "donator" && parseInt(donatorId) === userId && " (Myself)"}
                    </Typography>
                    <List>
                        {reviews.map((review) => (
                            <React.Fragment key={review.id}>
                                <ListItem alignItems="flex-start" component="div">
                                    <ListItemAvatar>
                                        <Avatar>{getDisplayName(review)[0]}</Avatar>
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
                                                <Rating name="read-only" value={review.rating} readOnly size="small" />
                                            </Box>
                                        }
                                        secondary={
                                            <>
                                                <Typography variant="body2" color="textPrimary" sx={{ mt: 1 }}>
                                                    {review.comment}
                                                </Typography>
                                                {review.images && review.images.length > 0 && (
                                                    <Box sx={{ display: 'flex', mt: 2 }}>
                                                        {review.images.map((image, index) => (
                                                            <Box
                                                                key={index}
                                                                sx={{
                                                                    position: 'relative',
                                                                    width: 80,
                                                                    height: 80,
                                                                    mr: 1,
                                                                    cursor: 'pointer',
                                                                }}
                                                                onClick={() => handleImageClick(`${backendRoute}/uploads/${image.url}`)}
                                                            >
                                                                <Box
                                                                    sx={{
                                                                        width: '100%',
                                                                        height: '100%',
                                                                        backgroundImage: `url(${backendRoute}/uploads/${image.url})`,
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
                                                        ))}
                                                    </Box>
                                                )}
                                                {userRole === "donator" && parseInt(donatorId) === userId && !review.reply && (
                                                    <Button
                                                        size="small"
                                                        startIcon={<ReplyIcon />}
                                                        onClick={() => handleReplyClick(review)}
                                                        sx={{ mt: 1 }}
                                                    >
                                                        Reply
                                                    </Button>
                                                )}
                                                {review.reply && (
                                                    <Box sx={{ mt: 2, bgcolor: '#f5f5f5', p: 1, borderRadius: 1 }}>
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
                                                    </Box>
                                                )}

                                            </>
                                        }
                                    />
                                </ListItem>
                                <Divider variant="inset" component="li" />
                            </React.Fragment>
                        ))}
                    </List>
                </Paper>

                <Dialog
                    open={deleteDialogOpen}
                    onClose={handleDeleteCancel}
                    aria-labelledby="delete-dialog-title"
                    aria-describedby="delete-dialog-description"
                >
                    <DialogTitle id="delete-dialog-title">{"Confirm Delete"}</DialogTitle>
                    <DialogContent>
                        <DialogContentText id="delete-dialog-description">
                            Are you sure you want to delete this review?
                        </DialogContentText>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleDeleteCancel}>Cancel</Button>
                        <Button onClick={handleDeleteConfirm} autoFocus>
                            Delete
                        </Button>
                    </DialogActions>
                </Dialog>

                <Dialog
                    open={editDialogOpen}
                    onClose={handleEditCancel}
                    aria-labelledby="edit-dialog-title"
                    aria-describedby="edit-dialog-description"
                >
                    <DialogTitle id="edit-dialog-title">{"Edit Review"}</DialogTitle>
                    <DialogContent>
                        <Rating
                            name="rating"
                            value={reviewToEdit ? reviewToEdit.rating : 0}
                            onChange={(event, newValue) => handleEditChange('rating', newValue)}
                        />
                        <TextField
                            autoFocus
                            margin="dense"
                            id="comment"
                            label="Comment"
                            type="text"
                            fullWidth
                            variant="standard"
                            value={reviewToEdit ? reviewToEdit.comment : ''}
                            onChange={(e) => handleEditChange('comment', e.target.value)}
                        />
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleEditCancel}>Cancel</Button>
                        <Button onClick={handleEditConfirm} autoFocus>
                            Save
                        </Button>
                    </DialogActions>
                </Dialog>

                <Dialog
                    open={replyDialogOpen}
                    onClose={handleReplyCancel}
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
                        <Button onClick={handleReplyCancel}>Cancel</Button>
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
                    onClose={handleSnackbarClose}
                    message={snackbar.message}
                />
            </Container>
        </>
    );
}



