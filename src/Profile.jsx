import React, { useEffect, useState } from 'react';
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
  DialogTitle
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { backendRoute } from './utils/BackendUrl';

export default function Profile() {
    const { donatorId } = useParams();
    const [profiles, setProfiles] = useState([]);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [reviewToDelete, setReviewToDelete] = useState(null);

    useEffect(() => {
        fetchProfiles();
    }, [donatorId]);

    const fetchProfiles = async () => {
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
            setProfiles(data);
        } catch (error) {
            console.error('Error fetching profiles:', error);
        }
    };

    const handleDeleteClick = (reviewId) => {
        setReviewToDelete(reviewId);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (reviewToDelete) {
            try {
                const response = fetch(`${backendRoute}/reviews/${reviewToDelete}`, {
                    method: 'DELETE',
                }).then((response) => {
                    if (!response.ok) {
                        throw new Error('Failed to delete review');
                    }
                })
                const response2 = fetch(`${backendRoute}/reviews/${donatorId}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }).then((response2) => {
                    if (!response2.ok) {
                        throw new Error('Failed to fetch profiles');
                    }
                    response2.json().then((result) => {
                        setProfiles(result);
                        console.log(profiles)
                    });
                })
                setDeleteDialogOpen(false);
            } catch (error) {
                console.error('Error deleting review:', error);
            }
        }
        setDeleteDialogOpen(false);
        setReviewToDelete(null);
    };

    const handleDeleteCancel = () => {
        setDeleteDialogOpen(false);
        setReviewToDelete(null);
    };

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
        </Container>
    );
}