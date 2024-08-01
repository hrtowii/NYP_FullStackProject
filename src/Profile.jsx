import React, { useEffect, useState, useCallback, useContext } from 'react';
import { UserNavbar } from './components/Navbar'
import { useParams } from 'react-router-dom';
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
    AppBar,
    Toolbar
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import EditIcon from '@mui/icons-material/Edit';
import { TokenContext } from './utils/TokenContext';
import parseJwt from './utils/parseJwt.jsx'
import { backendRoute } from './utils/BackendUrl.jsx'

export default function Profile() {
    const { token } = useContext(TokenContext);
    const userId = parseJwt(token).id
    const userRole = parseJwt(token).role
    const { donatorId } = useParams();
    const [reviews, setReviews] = useState([]);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [reviewToDelete, setReviewToDelete] = useState(null);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [reviewToEdit, setReviewToEdit] = useState(null);
    const [donatorName, setDonatorName] = useState("Loading...");
    const [likedReviews, setLikedReviews] = useState({});
    const [replyDialogOpen, setReplyDialogOpen] = useState(false);
    const [replyContent, setReplyContent] = useState('');
    const [reviewToReply, setReviewToReply] = useState(null);
    const [editReplyDialogOpen, setEditReplyDialogOpen] = useState(false);
    const [replyToEdit, setReplyToEdit] = useState(null);
    const [editedReplyContent, setEditedReplyContent] = useState('');
    const [enlargedImage, setEnlargedImage] = useState(null);
    const [deleteReplyDialogOpen, setDeleteReplyDialogOpen] = useState(false);
    const [replyToDelete, setReplyToDelete] = useState(null);

    const handleThumbsUp = useCallback((reviewId) => {
        setLikedReviews(prev => ({
            ...prev,
            [reviewId]: !prev[reviewId]
        }));
    }, []);

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
        }
    }, [donatorId]);

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

    console.log('Rendering Profile component', { reviews, deleteDialogOpen, reviewToDelete, editDialogOpen, reviewToEdit });

    return (
        <>
            <UserNavbar />
            <Container maxWidth="md">
                <Paper elevation={3} style={{ padding: '20px', marginTop: '20px' }}>
                    <Typography variant="h4" gutterBottom>
                        Reviews for {donatorName}
                        {userRole === "donator" && parseInt(donatorId) === userId && " (Myself)"}
                    </Typography>
                    <List>
                        {reviews.map((review) => (
                            <ListItem key={review.id} alignItems="flex-start" divider component="div">
                                <Box sx={{ display: 'flex', width: '100%' }}>
                                    <ListItemAvatar>
                                        <Avatar>{getDisplayName(review)[0]}</Avatar>
                                    </ListItemAvatar>
                                    <Box sx={{ flex: 1 }}>
                                        <Typography variant="subtitle1">{getDisplayName(review)}</Typography>
                                        <Box sx={{ mt: 1 }}>
                                            <Rating name="read-only" value={review.rating} readOnly size="small" />
                                        </Box>
                                        <Typography variant="body2" sx={{ mt: 1 }}>
                                            {review.comment}
                                        </Typography>
                                        {review.images && review.images.length > 0 && (
                                            <Box sx={{ display: 'flex', mt: 2 }}>
                                                {review.images.map((image, index) => (
                                                    <Box
                                                        key={index}
                                                        sx={{
                                                            width: 100,
                                                            height: 100,
                                                            mr: 1,
                                                            backgroundImage: `url(${backendRoute}/uploads/${image.url})`,
                                                            backgroundSize: 'cover',
                                                            backgroundPosition: 'center',
                                                            cursor: 'pointer',
                                                            border: '2px solid black', // Add this line for the border
                                                            borderRadius: '4px', // Optional: adds rounded corners
                                                        }}
                                                        onClick={() => handleImageClick(`${backendRoute}/uploads/${image.url}`)}
                                                    />
                                                ))}
                                            </Box>
                                        )}
                                        {userRole === "donator" && parseInt(donatorId) === userId && !review.reply && (
                                            <Button sx={{ mt: 1 }} onClick={() => handleReplyClick(review)}>Reply</Button>
                                        )}
                                        {review.reply && (
                                            <Box sx={{ mt: 1 }}>
                                                <Typography variant="subtitle2">Donator's Reply:</Typography>
                                                <Typography variant="body2">{review.reply.content}</Typography>
                                                {userRole === "donator" && parseInt(donatorId) === userId && (
                                                    <Box sx={{ display: 'flex', mt: 1 }}>
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
                                    </Box>
                                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                        {userId === review.userId && (
                                            <>
                                                <IconButton edge="end" aria-label="edit" onClick={() => handleEditClick(review)}>
                                                    <EditIcon />
                                                </IconButton>
                                                <IconButton edge="end" aria-label="delete" onClick={() => handleDeleteClick(review.id)}>
                                                    <DeleteIcon />
                                                </IconButton>
                                            </>
                                        )}
                                        <IconButton edge="end" aria-label="thumbs up" onClick={() => handleThumbsUp(review.id)}>
                                            <ThumbUpIcon color={likedReviews[review.id] ? 'primary' : 'default'} />
                                        </IconButton>
                                    </Box>
                                </Box>
                            </ListItem>
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



