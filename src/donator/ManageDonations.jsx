import React, { useState, useEffect, useContext, useCallback } from 'react';
import { NavLink } from 'react-router-dom';
import '../index.css';
import './DonatorLanding.css';
import "./ManageDonations.css";
import { DonatorNavbar } from '../components/Navbar';
import SettingsIcon from '@mui/icons-material/Settings';
import { backendRoute } from '../utils/BackendUrl';
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

export default function ManageDonations() {
  const [donations, setDonations] = useState([]);
  const { donatorId } = useParams();
  const [sortBy, setSortBy] = useState('expiryDate');
  const [order, setOrder] = useState('asc');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [donationToDelete, setDonationToDelete] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [totalPages, setTotalPages] = useState(0);

  const fetchDonations = useCallback(async () => {
    console.log('Fetching donations...');
    try {
      const response = await fetch(`${backendRoute}/donations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch donations');
      }
      const data = await response.json();
      console.log('donations fetched:', data);
      setDonations(prevDonations => {
        // Merge new data with existing reviews, prioritizing new data
        const updatedDonations = [...data];
        prevDonations.forEach(donation => {
          if (!updatedDonations.some(newDonation => newDonation.id === donation.id)) {
            updatedDonations.push(donation);
          }
        });
        return updatedDonations;
      });
    } catch (error) {
      console.error('Error fetching reviews:', error);
      // Handle error (e.g., show an error message to the user)
    }
  }, [backendRoute]);

  const handleDeleteClick = useCallback((donationId) => {
    console.log('Delete clicked for donation:', donationId);
    setDonationToDelete(donationId);
    setDeleteDialogOpen(true);
  }, []);


  useEffect(() => {
    fetchDonations();
  }, [fetchDonations]);

  const handleDeleteConfirm = useCallback(async () => {
    console.log('Delete confirmed for donation:', donationToDelete);
    if (donationToDelete) {
      try {
        console.log('Sending delete request...');
        const response = await fetch(`${backendRoute}/donations/${donationToDelete}`, {
          method: 'DELETE',
        });

        console.log('Delete response received:', response.status);

        if (response.ok) {
          console.log('donation deleted successfully');
          setReviews(prevDonations => prevDonations.filter(review => donation.id !== donationToDelete));
        } else {
          console.error('Server responded with an error:', response.status);
          throw new Error(`Failed to delete donation: ${response.status}`);
        }
      } catch (error) {
        console.error('Error during delete operation:', error);
      } finally {
        setDeleteDialogOpen(false);
        setReviewToDelete(null);
        // Optionally, refresh the donations list 
        fetchReviews().catch(err => console.error('Error refreshing donations:', err));
      }
    }
  }, [donationToDelete, backendRoute, setDonations, setDeleteDialogOpen, setDonationToDelete, fetchDonations]);

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

  console.log('Rendering donation component', { donations, deleteDialogOpen, donationToDelete });

  const handleSort = (category) => {
    if (sortBy === category) {
      setOrder(order === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(category);
      setOrder('asc');
    }
  };

  return (
    <div className="container">
      <DonatorNavbar />
      <div className='contents'>
        <div className="action-buttons">
          <button className="btn btn-primary">
            <SettingsIcon className="icon" />
            <NavLink to="/donator/ManageDonations">Manage Donations</NavLink>
          </button>
          <button className="btn btn-secondary">
            <SettingsIcon className="icon" />
            <NavLink to="/donator/TrackDonations">Track Donation Progress</NavLink>
          </button>
          <button className="btn btn-secondary">
            <SettingsIcon className="icon" />
            <NavLink to="/donator/DonateItem">Donate Items</NavLink>
          </button>
        </div>

        <Container maxWidth="md">
          <Paper elevation={3} style={{ padding: '20px', marginTop: '20px' }}>
            <Typography variant="h4" gutterBottom>
              Donations for {donatorId}
            </Typography>
            <List>
              {donations.map((review) => (
                <ListItem key={donation.id} divider>
                  <ListItemText
                    primary={`daontion: ${donation.location}`}
                    secondary={donation.category}
                  />
                  <IconButton edge="end" aria-label="delete" onClick={() => handleDeleteClick(donation.id)}>
                    <DeleteIcon />
                  </IconButton>
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
      </div>
    </div>
  );
}