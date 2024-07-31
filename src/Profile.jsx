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
    Snackbar
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { backendRoute } from './utils/BackendUrl';
import { EditIcon } from 'lucide-react';
import { TokenContext } from './utils/TokenContext';

function parseJwt(token) {
    var base64Url = token.split('.')[1];
    var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    var jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
}

export default function Profile() {
    const {token} = useContext(TokenContext);
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
    const getDisplayName = (review) => {
        if (review.isAnonymous) {
            const name = review.user?.person?.name || 'Unknown User';
            return `${name[0]}${'*'.repeat(name.length - 1)}`;
        }
        return review.user?.person?.name || 'Unknown User';
    };

    console.log('Rendering Profile component', { reviews, deleteDialogOpen, reviewToDelete, editDialogOpen, reviewToEdit });

    return (
        <>
        <Navbar/>
        <Container maxWidth="md">
            <Paper elevation={3} style={{ padding: '20px', marginTop: '20px' }}>
                <Typography variant="h4" gutterBottom>
                    Reviews for {donatorName}
                </Typography>
                <List>
                    {reviews.map((review) => (
                        <ListItem key={review.id} divider>
                        <ListItemText
                            primary={`${getDisplayName(review)} - Rating: ${review.rating}`}
                            secondary={review.comment}
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
                {/* <DialogActions>
                    <Alert icon={<CheckIcon fontSize="inherit" />} severity="success">
                    Here is a gentle confirmation that your action was successful.
                    </Alert>
                </DialogActions> */}

            </Dialog>
        </Container>
        </>
    );
}