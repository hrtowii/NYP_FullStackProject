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
  TableSortLabel,
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
  IconButton,
} from '@mui/material';
import Box from '@mui/material/Box';
import SearchIcon from '@mui/icons-material/Search';
import CancelIcon from '@mui/icons-material/Cancel';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import { DonatorNavbar } from '../components/Navbar';
import { backendRoute } from '../utils/BackendUrl';
import { TokenContext } from '../utils/TokenContext';
import parseJwt from '../utils/parseJwt.jsx'


export default function ManageDonations() {
  const [donations, setDonations] = useState([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [donationToDelete, setDonationToDelete] = useState(null);
  const [editingDonation, setEditingDonation] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [errors, setErrors] = useState({});
  const [order, setOrder] = useState('asc');
  const [orderBy, setOrderBy] = useState('name');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { token, updateToken } = useContext(TokenContext);
  const [enlargedImage, setEnlargedImage] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');


  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
  };

  const handleCloseEnlargedImage = () => {
    setEnlargedImage(null);
  };

  const handleImageClick = (imageUrl) => {
    setEnlargedImage(imageUrl);
  };

  const fetchDonations = useCallback(async () => {
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
      console.log(data)
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

  const formatImagePath = (path) => {
    if (!path) return '';
    const formattedPath = `${backendRoute}/${path.replace(/\\/g, '/').replace(/^public/, '')}`;
    console.log('Formatted Image Path:', formattedPath);
    return path.replace(/\\/g, '/').replace(/^public/, '');
  };

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

  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  }

  const sortedDonations = React.useMemo(() => {
    const comparator = (a, b) => {
      if (orderBy === 'name') {
        return order === 'asc'
          ? a.foods[0].name.localeCompare(b.foods[0].name)
          : b.foods[0].name.localeCompare(a.foods[0].name);
      } else if (orderBy === 'quantity') {
        return order === 'asc'
          ? a.foods[0].quantity - b.foods[0].quantity
          : b.foods[0].quantity - a.foods[0].quantity;
      } else if (orderBy === 'expiryDate') {
        return order === 'asc'
          ? new Date(a.foods[0].expiryDate) - new Date(b.foods[0].expiryDate)
          : new Date(b.foods[0].expiryDate) - new Date(a.foods[0].expiryDate);
      }
      return 0;
    };

    const searchFields = (donation) => {
      const searchableFields = [
        ...donation.foods.flatMap(food => [
          food.name,
          food.type,
          food.quantity.toString(),
          new Date(food.expiryDate).toLocaleDateString()
        ]),
        donation.category,
        donation.location,
        donation.remarks,
        new Date(donation.deliveryDate).toLocaleDateString(),
        donation.availability
      ];

      return searchableFields.some(field =>
        field && field.toString().toLowerCase().includes(searchQuery.toLowerCase())
      );
    };

    return [...donations]
      .sort(comparator)
      .filter(searchFields);
  }, [donations, order, orderBy, searchQuery]);

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

        <Container maxWidth={false} style={{ width: '90%', marginTop: '20px' }}>
          <Paper elevation={3} style={{ padding: '20px', marginTop: '20px' }}>
            <Typography variant="h4" gutterBottom>
              My Donations
            </Typography>
            <Box sx={{ mb: 3, width: '100%' }}>
              <TextField
                fullWidth
                variant="outlined"
                size="small"
                placeholder="Search donations by any field..."
                value={searchQuery}
                onChange={handleSearchChange}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ color: 'action.active', mr: 1 }} />,
                  endAdornment: searchQuery && (
                    <IconButton size="small" onClick={() => setSearchQuery('')}>
                      <CancelIcon />
                    </IconButton>
                  ),
                }}
              />
            </Box>
            {donations.length === 0 ? (
              <Typography align="center" variant="h6" style={{ marginTop: '20px' }}>
                You have no donations at the moment. Click 'Donate New Item' to make a donation.
              </Typography>
            ) : (
              <TableContainer>
                <Table aria-label="donations table">
                  <TableHead>
                    <TableRow>
                      <TableCell>Image</TableCell>
                      <TableCell>
                        <TableSortLabel
                          active={orderBy === 'name'}
                          direction={orderBy === 'name' ? order : 'asc'}
                          onClick={() => handleRequestSort('name')}
                        >
                          Food
                        </TableSortLabel>
                      </TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>
                        <TableSortLabel
                          active={orderBy === 'quantity'}
                          direction={orderBy === 'quantity' ? order : 'asc'}
                          onClick={() => handleRequestSort('quantity')}
                        >
                          Quantity (g)
                        </TableSortLabel>
                      </TableCell>
                      <TableCell>Category</TableCell>
                      <TableCell>
                        <TableSortLabel
                          active={orderBy === 'expiryDate'}
                          direction={orderBy === 'expiryDate' ? order : 'asc'}
                          onClick={() => handleRequestSort('expiryDate')}
                        >
                          Expiry Date
                        </TableSortLabel>
                      </TableCell>
                      <TableCell>Remarks</TableCell>
                      <TableCell>Location</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {sortedDonations.flatMap((donation) =>
                      donation.foods.map((food) => (
                        <TableRow key={`${donation.id}-${food.id}`}>
                          <TableCell>
                            {donation.image && (
                              <Box
                                sx={{
                                  position: 'relative',
                                  width: 80,
                                  height: 80,
                                  cursor: 'pointer',
                                }}
                                onClick={() => handleImageClick(`${backendRoute}${formatImagePath(donation.image)}`)}
                              >
                                <Box
                                  sx={{
                                    width: '100%',
                                    height: '100%',
                                    backgroundImage: `url(${backendRoute}${formatImagePath(donation.image)})`,
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
                            )}
                          </TableCell>
                          <TableCell>{food.name || 'N/A'}</TableCell>
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