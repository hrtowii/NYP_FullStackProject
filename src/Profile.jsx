import React, { useEffect, useState, useCallback, useContext } from 'react';
import Navbar from "./components/Navbar";
import { useParams } from 'react-router-dom';
import {
    List,
    ListItem,
    ListItemText,
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
    Alert
} from '@mui/material';
import Box from '@mui/material/Box';
import DeleteIcon from '@mui/icons-material/Delete';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import ReplyIcon from '@mui/icons-material/Reply';
import { backendRoute } from './utils/BackendUrl';
import { EditIcon } from 'lucide-react';
import { TokenContext } from './utils/TokenContext';

function parseJwt(token) {
    var base64Url = token.split('.')[1];
    var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    var jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function (c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
}

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
    const [replyDialogOpen, setReplyDialogOpen] = useState(false);
    const [reviewToReply, setReviewToReply] = useState(null);
    const [replyText, setReplyText] = useState('');

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
            // Handle error (e.g., show an error message to the user)
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
                });

                console.log('Delete response received:', response.status);

                if (response.ok) {
                    console.log('Review deleted successfully');
                    setReviews(prevReviews => prevReviews.filter(review => review.id !== reviewToDelete));
                } else {
                    console.error('Server responded with an error:', response.status);
                    throw new Error(`Failed to delete review: ${response.status}`);
                }
            } catch (error) {
                console.error('Error during delete operation:', error);
            } finally {
                setDeleteDialogOpen(false);
                setReviewToDelete(null);
                fetchReviews();
            }
        }
    }, [reviewToDelete, fetchReviews]);

    const handleDeleteCancel = useCallback(() => {
        console.log('Delete cancelled');
        setDeleteDialogOpen(false);
        setReviewToDelete(null);
    }, []);

    const handleEditClick = useCallback((review) => {
        console.log('Edit clicked for review:', review.id);
        setReviewToEdit({ ...review });  // Create a copy of the review
        setEditDialogOpen(true);
    }, []);

    const handleEditConfirm = useCallback(async () => {
        console.log('Edit confirmed for review:', reviewToEdit);
        if (reviewToEdit && reviewToEdit.id) {  // Ensure reviewToEdit and its id exist
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
    }, [reviewToEdit, backendRoute]);

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

    const handleReplyClick = useCallback((review) => {
        if (userId === parseInt(donatorId)) {
            setReviewToReply(review);
            setReplyDialogOpen(true);
        } else {
            setSnackbar({ open: true, message: 'Only the donator can reply to reviews', severity: 'warning' });
        }
    }, [userId, donatorId]);

    const handleReplyCancel = useCallback(() => {
        setReplyDialogOpen(false);
        setReviewToReply(null);
        setReplyText('');
    }, []);
    
    const handleReplyConfirm = useCallback(async () => {
        if (reviewToReply && replyText) {
            try {
                const response = await fetch(`${backendRoute}/reviews/${reviewToReply.id}/reply`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                    body: JSON.stringify({ reply: replyText, userId }),
                });

                if (response.ok) {
                    setSnackbar({ open: true, message: 'Reply posted successfully', severity: 'success' });
                    fetchReviews(); // Refresh the reviews to show the new reply
                } else {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Failed to post reply');
                }
            } catch (error) {
                console.error('Error posting reply:', error);
                setSnackbar({ open: true, message: error.message, severity: 'error' });
            } finally {
                setReplyDialogOpen(false);
                setReviewToReply(null);
                setReplyText('');
            }
        }
    }, [reviewToReply, replyText, token, fetchReviews, userId]);

    console.log('Rendering Profile component', { reviews, deleteDialogOpen, reviewToDelete, editDialogOpen, reviewToEdit });
    console.log('Sending userId:', userId);
    console.log('Received userId:', userId);

    return (
        <>
            <Navbar />
            <Container maxWidth="md">
                <Paper elevation={3} style={{ padding: '20px', marginTop: '20px', minHeight: '400px', display: 'flex', flexDirection: 'column' }}>
                    <Typography variant="h4" gutterBottom>
                        Reviews for {donatorName}
                    </Typography>
                    {reviews.length > 0 ? (
                        <List>
                            {reviews.map((review) => (
                                <ListItem key={review.id} divider>
                                    <ListItemText
                                        primary={`${review.user?.person?.name || 'Unknown User'} - Rating: ${review.rating}`}
                                        secondary={
                                            <>
                                                <Typography component="span" variant="body2" color="textPrimary">
                                                    {review.comment}
                                                </Typography>
                                                {review.reply && (
                                                    <Typography component="p" variant="body2" style={{ marginTop: '8px', color: 'gray' }}>
                                                        Reply: {review.reply}
                                                    </Typography>
                                                )}
                                            </>
                                        }
                                    />
                                    {(review.userId === userId || userRole === "admin") && (
                                        <IconButton edge="end" aria-label="delete" onClick={() => handleDeleteClick(review.id)}>
                                            <DeleteIcon />
                                        </IconButton>
                                    )}
                                    {review.userId === userId && (
                                        <IconButton onClick={() => handleEditClick(review)}>
                                            <EditIcon />
                                        </IconButton>
                                    )}
                                    {userId === parseInt(donatorId) && !review.reply && (
                                        <IconButton onClick={() => handleReplyClick(review)}>
                                            <ReplyIcon />
                                        </IconButton>
                                    )}
                                </ListItem>
                            ))}
                        </List>
                    ) : (
                        <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" flexGrow={1}>
                            <ErrorOutlineIcon style={{ fontSize: 60, marginBottom: '20px', color: '#f44336' }} />
                            <Typography variant="h6" align="center">
                                There are currently no reviews for this donator.
                            </Typography>
                        </Box>
                    )}
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
                    {/* <DialogActions>
                    <Alert icon={<CheckIcon fontSize="inherit" />} severity="success">
                    Here is a gentle confirmation that your action was successful.
                    </Alert>
                </DialogActions> */}

                </Dialog>

                <Dialog open={replyDialogOpen} onClose={handleReplyCancel}>
                    <DialogTitle>Reply to Review</DialogTitle>
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
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                        />
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleReplyCancel}>Cancel</Button>
                        <Button onClick={handleReplyConfirm} color="primary">
                            Post Reply
                        </Button>
                    </DialogActions>
                </Dialog>

                <Snackbar
                    open={snackbar.open}
                    autoHideDuration={6000}
                    onClose={handleSnackbarClose}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                >
                    <Alert onClose={handleSnackbarClose} severity={snackbar.severity} sx={{ width: '100%' }}>
                        {snackbar.message}
                    </Alert>
                </Snackbar>
            </Container>
        </>
    );
}