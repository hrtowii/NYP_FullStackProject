import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { NavLink } from 'react-router-dom';
import '../index.css';
import './DonatorLanding.css';
import "./ManageDonations.css";
import { DonatorNavbar } from '../components/Navbar';
import SettingsIcon from '@mui/icons-material/Settings';
import { backendRoute } from '../utils/BackendUrl';
import { useParams } from 'react-router-dom';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Typography,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Button
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';

function Row(props) {
  const { donation, handleDeleteClick } = props;
  const [open, setOpen] = useState(false);

  return (
    <>
      <TableRow>
        <TableCell>
          <IconButton
            aria-label="expand row"
            size="small"
            onClick={() => setOpen(!open)}
          >
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </TableCell>
        <TableCell>{donation.category}</TableCell>
        <TableCell>{new Date(donation.deliveryDate).toLocaleDateString()}</TableCell>
        <TableCell>{donation.location}</TableCell>
        <TableCell>{donation.remarks}</TableCell>
        <TableCell>
          <IconButton aria-label="delete" onClick={() => handleDeleteClick(donation.id)}>
            <DeleteIcon />
          </IconButton>
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box margin={1}>
              <Typography variant="h6" gutterBottom component="div">
                Foods
              </Typography>
              <Table size="small" aria-label="foods">
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Quantity</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Expiry Date</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {donation.foods.map((food) => (
                    <TableRow key={food.id}>
                      <TableCell component="th" scope="row">
                        {food.name}
                      </TableCell>
                      <TableCell>{food.quantity}</TableCell>
                      <TableCell>{food.type}</TableCell>
                      <TableCell>{new Date(food.expiryDate).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
}

export default function ManageDonations() {
  const [donations, setDonations] = useState([]);
  const { donatorId } = useParams();
  const [sortBy, setSortBy] = useState('expiryDate');
  const [order, setOrder] = useState('asc');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [donationToDelete, setDonationToDelete] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

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

      // Ensure data.donations is an array before setting state
      const donationsArray = Array.isArray(data.donations) ? data.donations : [];

      setDonations(prevDonations => {
        // Merge new data with existing donations, prioritizing new data
        const updatedDonations = [...donationsArray];
        prevDonations.forEach(donation => {
          if (!updatedDonations.some(newDonation => newDonation.id === donation.id)) {
            updatedDonations.push(donation);
          }
        });
        return updatedDonations;
      });
    } catch (error) {
      console.error('Error fetching donations:', error);
      // Handle error (e.g., show an error message to the user)
    }
  }, [backendRoute]);

  const sortedDonations = useMemo(() => {
    return [...donations].sort((a, b) => {
      if (sortBy === 'expiryDate') {
        return order === 'asc'
          ? new Date(a.expiryDate) - new Date(b.expiryDate)
          : new Date(b.expiryDate) - new Date(a.expiryDate);
      } else if (sortBy === 'category') {
        return order === 'asc'
          ? a.category.localeCompare(b.category)
          : b.category.localeCompare(a.category);
      }
      // Add more sorting options as needed
      return 0;
    });
  }, [donations, sortBy, order]);

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
          setReviews(prevDonations => prevDonations.filter(donation => donation.id !== donationToDelete));
        } else {
          console.error('Server responded with an error:', response.status);
          throw new Error(`Failed to delete donation: ${response.status}`);
        }
      } catch (error) {
        console.error('Error during delete operation:', error);
      } finally {
        setDeleteDialogOpen(false);
        setDonationToDelete(null);
        // Optionally, refresh the donations list 
        fetchDonations().catch(err => console.error('Error refreshing donations:', err));
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

        <div className="container">
          <DonatorNavbar />
          <div className='contents'>
            {/* ... existing action buttons ... */}

            <Container maxWidth="md">
              <Paper elevation={3} style={{ padding: '20px', marginTop: '20px' }}>
                <Typography variant="h4" gutterBottom>
                  Donations for {donatorId}
                </Typography>
                <TableContainer component={Paper}>
                  <Table aria-label="collapsible table">
                    <TableHead>
                      <TableRow>
                        <TableCell />
                        <TableCell>Category</TableCell>
                        <TableCell>Delivery Date</TableCell>
                        <TableCell>Location</TableCell>
                        <TableCell>Remarks</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {donations.map((donation) => (
                        <Row key={donation.id} donation={donation} handleDeleteClick={handleDeleteClick} />
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
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
                    Are you sure you want to delete this donation?
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
      </div>
    </div>
  );
}