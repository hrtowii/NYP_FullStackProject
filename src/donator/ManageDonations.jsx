import React, { useState, useEffect, useCallback, useContext } from 'react';
import { NavLink } from 'react-router-dom';
import {
  Paper,
  Typography,
  Container,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  FormHelperText,
  CircularProgress,
  Alert,
  Box,
} from '@mui/material';
import { DonatorNavbar } from '../components/Navbar';
import { backendRoute } from '../utils/BackendUrl';
import { TokenContext } from '../utils/TokenContext';

export default function ManageDonations() {
  const [donations, setDonations] = useState([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [donationToDelete, setDonationToDelete] = useState(null);
  const [editingDonation, setEditingDonation] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [errors, setErrors] = useState({});
  const [sortBy, setSortBy] = useState('expiryDate');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { token, updateToken } = useContext(TokenContext);

  const fetchDonations = useCallback(async () => {
    function parseJwt(token) {
      var base64Url = token.split('.')[1];
      var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      var jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function (c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      return JSON.parse(jsonPayload);
    }
    const donatorId = parseJwt(token).id
    if (!donatorId) {
      setError('No donator ID provided');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${backendRoute}/donations/${donatorId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setDonations(data.donations);
      setError(null);
    } catch (error) {
      console.error('Error fetching donations:', error);
      setError('Failed to fetch donations. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDonations();
  }, [fetchDonations]);

  const handleDeleteClick = (donationId) => {
    setDonationToDelete(donationId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (donationToDelete) {
      try {
        const response = await fetch(`${backendRoute}/donations/${donationToDelete}`, {
          method: 'DELETE',
        });
        const data = await response.json();
        if (response.ok) {
          setDonations(prevDonations => prevDonations.filter(donation => donation.id !== donationToDelete));
          console.log(data.message);
        } else {
          throw new Error(data.error || 'Failed to delete donation');
        }
      } catch (error) {
        console.error('Error during delete operation:', error);
        setError('Failed to delete donation. Please try again.');
      } finally {
        setDeleteDialogOpen(false);
        setDonationToDelete(null);
      }
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setDonationToDelete(null);
  };

  const handleEditClick = (donationId) => {
    const donationToEdit = donations.find(donation => donation.id === donationId);
    setEditingDonation({ ...donationToEdit });
    setEditDialogOpen(true);
    setErrors({});
  };

  const handleEditCancel = () => {
    setEditingDonation(null);
    setEditDialogOpen(false);
    setErrors({});
  };

  const validateForm = () => {
    const newErrors = {};
    if (!editingDonation.category) newErrors.category = 'Category is required';
    editingDonation.foods.forEach((food, index) => {
      if (!food.name) newErrors[`foodName${index}`] = 'Food name is required';
      if (!food.quantity) newErrors[`foodQuantity${index}`] = 'Quantity is required';
      if (!food.expiryDate) newErrors[`foodExpiryDate${index}`] = 'Expiry date is required';
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleEditSave = async () => {
    if (validateForm()) {
      try {
        const response = await fetch(`${backendRoute}/donations/${editingDonation.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(editingDonation),
        });
        if (!response.ok) {
          throw new Error('Failed to update donation');
        }
        const updatedDonation = await response.json();
        setDonations(prevDonations =>
          prevDonations.map(donation =>
            donation.id === updatedDonation.id ? updatedDonation : donation
          )
        );
        setEditingDonation(null);
        setEditDialogOpen(false);
      } catch (error) {
        console.error('Error updating donation:', error);
        setError('Failed to update donation. Please try again.');
      }
    }
  };

  const handleEditChange = (e, field) => {
    setEditingDonation(prev => ({ ...prev, [field]: e.target.value }));
  };

  const handleSortChange = (event) => {
    setSortBy(event.target.value);
  };
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <div className="container">
      <DonatorNavbar />
      <div className='contents'>
        <div className="centered">
          <div className="action-buttons">
            <Button variant="contained" color="primary" component={NavLink} to="/donator/ManageDonations">
              Manage Donations
            </Button>
            <Button variant="contained" color="secondary" component={NavLink} to="/donator/DonateProgress">
              Track Donation Progress
            </Button>
            <Button variant="contained" color="secondary" component={NavLink} to="/donator/DonateItem">
              Donate New Item
            </Button>
          </div>
        </div>

        <Container maxWidth="md">
          <Paper elevation={3} style={{ padding: '20px', marginTop: '20px' }}>
            <Typography variant="h4" gutterBottom>
              My Donations
            </Typography>
            <FormControl fullWidth style={{ marginBottom: '20px' }}>
              <InputLabel id="sort-select-label">Sort By</InputLabel>
              <Select
                labelId="sort-select-label"
                id="sort-select"
                value={sortBy}
                label="Sort By"
                onChange={handleSortChange}
              >
                <MenuItem value="category">Category</MenuItem>
                <MenuItem value="expiryDate">Expiry Date</MenuItem>
                <MenuItem value="quantity">Quantity</MenuItem>
              </Select>
            </FormControl>
            {donations.length === 0 ? (
              <Typography align="center" variant="h6" style={{ marginTop: '20px' }}>
                You have no donations at the moment. Click 'Donate New Item' to make a donation.
              </Typography>
            ) : (
              <TableContainer>
                <Table aria-label="donations table">
                  <TableHead>
                    <TableRow>
                      <TableCell>Food</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Quantity (kg)</TableCell>
                      <TableCell>Category</TableCell>
                      <TableCell>Expiry Date</TableCell>
                      <TableCell>Remarks</TableCell>
                      <TableCell>Location</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {donations.flatMap((donation) =>
                      donation.foods.map((food) => (
                        <TableRow key={`${donation.id}-${food.id}`}>
                          <TableCell>
                            {donation.imageUrl && (
                              <img
                                src={donation.imageUrl}
                                alt={food.name}
                                style={{ width: 50, height: 50, marginRight: 10, objectFit: 'cover' }}
                              />
                            )}
                            {food.name || 'N/A'}
                          </TableCell>
                          <TableCell>{food.type || 'N/A'}</TableCell>
                          <TableCell>{food.quantity || 'N/A'}</TableCell>
                          <TableCell>{donation.category || 'N/A'}</TableCell>
                          <TableCell>{new Date(food.expiryDate).toLocaleDateString() || 'N/A'}</TableCell>
                          <TableCell>{donation.remarks || 'N/A'}</TableCell>
                          <TableCell>{donation.location || 'N/A'}</TableCell>
                          <TableCell>
                            <Button variant="outlined" color="primary" style={{ marginRight: '8px' }} onClick={() => handleEditClick(donation.id)}>
                              Edit
                            </Button>
                            <Button variant="outlined" color="secondary" onClick={() => handleDeleteClick(donation.id)}>
                              Delete
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>
        </Container>

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
            <Button onClick={handleDeleteConfirm} color="secondary">
              Delete
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog open={editDialogOpen} onClose={handleEditCancel}>
          <DialogTitle>Edit Donation</DialogTitle>
          <DialogContent>
            {editingDonation && (
              <>
                <FormControl fullWidth margin="dense" error={!!errors.category}>
                  <InputLabel>Category</InputLabel>
                  <Select
                    value={editingDonation.category}
                    onChange={(e) => handleEditChange(e, 'category')}
                  >
                    <MenuItem value="perishable">Perishable</MenuItem>
                    <MenuItem value="non-perishable">Non-perishable</MenuItem>
                    <MenuItem value="canned">Canned</MenuItem>
                    <MenuItem value="frozen">Frozen</MenuItem>
                  </Select>
                  {errors.category && <FormHelperText>{errors.category}</FormHelperText>}
                </FormControl>
                <TextField
                  margin="dense"
                  label="Remarks"
                  type="text"
                  fullWidth
                  value={editingDonation.remarks}
                  onChange={(e) => handleEditChange(e, 'remarks')}
                />
                {editingDonation.foods.map((food, index) => (
                  <div key={food.id}>
                    <TextField
                      margin="dense"
                      label="Food Name"
                      type="text"
                      fullWidth
                      value={food.name}
                      onChange={(e) => {
                        const newFoods = [...editingDonation.foods];
                        newFoods[index].name = e.target.value;
                        setEditingDonation({ ...editingDonation, foods: newFoods });
                      }}
                      error={!!errors[`foodName${index}`]}
                      helperText={errors[`foodName${index}`]}
                    />
                    <TextField
                      margin="dense"
                      label="Quantity"
                      type="number"
                      fullWidth
                      value={food.quantity}
                      onChange={(e) => {
                        const newFoods = [...editingDonation.foods];
                        newFoods[index].quantity = parseInt(e.target.value);
                        setEditingDonation({ ...editingDonation, foods: newFoods });
                      }}
                      error={!!errors[`foodQuantity${index}`]}
                      helperText={errors[`foodQuantity${index}`]}
                    />
                    <TextField
                      margin="dense"
                      label="Expiry Date"
                      type="date"
                      fullWidth
                      value={new Date(food.expiryDate).toISOString().split('T')[0]}
                      onChange={(e) => {
                        const newFoods = [...editingDonation.foods];
                        newFoods[index].expiryDate = new Date(e.target.value);
                        setEditingDonation({ ...editingDonation, foods: newFoods });
                      }}
                      InputLabelProps={{
                        shrink: true,
                      }}
                      error={!!errors[`foodExpiryDate${index}`]}
                      helperText={errors[`foodExpiryDate${index}`]}
                    />
                  </div>
                ))}
              </>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleEditCancel}>Cancel</Button>
            <Button onClick={handleEditSave} color="primary">
              Save
            </Button>
          </DialogActions>
        </Dialog>
      </div>
    </div>
  );
}