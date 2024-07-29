import React, { useEffect, useState, useCallback } from 'react';
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
  Snackbar,
  Alert
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { backendRoute } from './utils/BackendUrl';

export default function Profile() {
    const { donatorId } = useParams();
    const [profiles, setProfiles] = useState([]);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [reviewToDelete, setReviewToDelete] = useState(null);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

    const fetchProfiles = useCallback(async () => {
        console.log('Fetching profiles...');
        try {
            const response = await fetch(`${backendRoute}/reviews/${donatorId}`, {
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
            setSnackbar({ open: true, message: 'Failed to fetch profiles', severity: 'error' });
        }
    }, [donatorId]);

    useEffect(() => {
        fetchProfiles();
    }, [fetchProfiles]);

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
                const deleteResponse = await fetch(`${backendRoute}/reviews/${reviewToDelete}`, {
                    method: 'DELETE',
                });
                console.log('Delete response received:', deleteResponse);
                
                if (!deleteResponse.ok) {
                    throw new Error(`Failed to delete review: ${deleteResponse.status} ${deleteResponse.statusText}`);
                }
                
                console.log('Delete request successful');
                setSnackbar({ open: true, message: 'Review deleted successfully', severity: 'success' });
                
                setDeleteDialogOpen(false);
                setReviewToDelete(null);

                console.log('Refreshing profiles...');
                await fetchProfiles();
            } catch (error) {
                console.error('Error deleting review:', error);
                setSnackbar({ open: true, message: `Error deleting review: ${error.message}`, severity: 'error' });
            }
        }
    }, [reviewToDelete, fetchProfiles]);

    const handleDeleteCancel = useCallback(() => {
        console.log('Delete cancelled');
        setDeleteDialogOpen(false);
        setReviewToDelete(null);
    }, []);

    const handleSnackbarClose = (event, reason) => {
        if (reason === 'clickaway') {
            return;
        }
        setSnackbar({ ...snackbar, open: false });
    };

    console.log('Rendering Profile component', { profiles, deleteDialogOpen, reviewToDelete });

    return (
        <Container maxWidth="md">
            <Paper elevation={3} style={{ padding: '20px', marginTop: '20px' }}>
                <Typography variant="h4" gutterBottom>
                    Reviews for {donatorId}
                </Typography>
                <List>
                    {profiles.map((profile, index) => (
                        <ListItem 
                            key={index} 
                            divider
                            secondaryAction={
                                <IconButton edge="end" aria-label="delete" onClick={() => handleDeleteClick(profile.id)}>
                                    <DeleteIcon />
                                </IconButton>
                            }
                        >
                            <ListItemText
                                primary={`Rating: ${profile.rating}`}
                                secondary={`Comment: ${profile.comment}`}
                            />
                        </ListItem>
                    ))}
                </List>
            </Paper>

            <Dialog
                open={deleteDialogOpen}
                onClose={handleDeleteCancel}
                aria-labelledby="alert-dialog-title"
                aria-describedby="alert-dialog-description"
            >
                <DialogTitle id="alert-dialog-title">{"Confirm Delete"}</DialogTitle>
                <DialogContent>
                    <DialogContentText id="alert-dialog-description">
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

            <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleSnackbarClose}>
                <Alert onClose={handleSnackbarClose} severity={snackbar.severity} sx={{ width: '100%' }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Container>
    );
}