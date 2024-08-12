import React, { useContext, useEffect, useState } from 'react';
import {
  Container,
  Modal,
  Typography,
  TextField,
  Button,
  Snackbar,
  Tab,
  Tabs,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  ThemeProvider
} from '@mui/material';
import Box from '@mui/material/Box';
import { AdminNavbar } from '../components/Navbar';
import { TokenContext } from '../utils/TokenContext';
import { backendRoute } from '../utils/BackendUrl';
import DataTable from '../components/DataTable.tsx';
import { theme } from '../user/UserLanding'
const getUserRole = (user) => {
  if (user.admin) return 'Admin';
  if (user.donator) return 'Donator';
  if (user.user) return 'User';
  return 'Unknown';
};

export default function AdminLanding() {
  const [openModal, setOpenModal] = useState(false);
  const [editData, setEditData] = useState({});
  const { token } = useContext(TokenContext);
  const [users, setUsers] = useState([]);
  const [events, setEvents] = useState([]);
  const [donations, setDonations] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  const userColumns = [
    { id: 'id', label: 'ID', minWidth: 50 },
    { id: 'name', label: 'Name', minWidth: 100 },
    { id: 'email', label: 'Email', minWidth: 170 },
    { id: 'role', label: 'Role', minWidth: 100 },
    { id: 'actions', label: 'Actions', minWidth: 100 },
  ];

  const eventColumns = [
    { id: 'id', label: 'ID', minWidth: 50 },
    { id: 'title', label: 'Title', minWidth: 75 },
    { id: 'fullSummary', label: 'Summary', minWidth: 100 },
    { id: 'startDate', label: 'Start Date', minWidth: 75, format: (value) => {
      const date = new Date(value);
      return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')} - ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    } },
    { id: 'endDate', label: 'End Date', minWidth: 75, format: (value) => {
      const date = new Date(value);
      return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')} - ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    } },
    { id: 'actions', label: 'Actions', minWidth: 100 },
  ];

  const donationColumns = [
    { id: 'id', label: 'ID', minWidth: 50 },
    { id: 'category', label: 'Category', minWidth: 75 },
    { id: 'donatorId', label: 'Donator ID', minWidth: 75 },
    { id: 'location', label: 'Location', minWidth: 100 },
    { id: 'createdAt', label: 'Created At', minWidth: 100, format: (value) => {
      const date = new Date(value);
      return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')} - ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    } },
    { id: 'remarks', label: 'Remarks', minWidth: 50 },
    { id: 'actions', label: 'Actions', minWidth: 100 },
  ];

  const reservationColumns = [
    { id: 'id', label: 'ID', minWidth: 50 },
    { id: 'userId', label: 'User ID', minWidth: 75 },
    { id: 'donationId', label: 'Donation ID', minWidth: 75 },
    { id: 'collectionDate', label: 'Collection Date', minWidth: 100, format: (value) => {
      const date = new Date(value);
      return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
    }},
    { id: 'collectionTimeStart', label: 'Start Time', minWidth: 75 },
    { id: 'collectionTimeEnd', label: 'End Time', minWidth: 75 },
    { id: 'collectionStatus', label: 'Status', minWidth: 100 },
    { id: 'remarks', label: 'Remarks', minWidth: 100 },
    { id: 'actions', label: 'Actions', minWidth: 100 },
  ];

  const reservationNestedConfig = {
    key: 'reservationItems',
    label: 'Reserved Items',
    columns: [
      { id: 'foodId', label: 'Food ID', minWidth: 50 },
      { id: 'foodName', label: 'Food Name', minWidth: 100 },
      { id: 'quantity', label: 'Quantity', minWidth: 50 },
      { id: 'foodType', label: 'Type', minWidth: 100 },
      { 
        id: 'foodExpiryDate', 
        label: 'Expiry Date', 
        minWidth: 100, 
        format: (value) => {
          if (value) {
            const date = new Date(value);
            return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
          }
          return 'N/A';
        }
      },
    ],
  };

  const donationNestedConfig = {
    key: 'foods',
    label: 'Foods',
    columns: [
      { id: 'name', label: 'Name', minWidth: 100 },
      { id: 'quantity', label: 'Quantity', minWidth: 50 },
      { id: 'type', label: 'Type', minWidth: 100 },
      { id: 'expiryDate', label: 'Expiry Date', minWidth: 100, format: (value) => {
        const date = new Date(value);
        return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')} - ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
      } },
    ],
  }

  useEffect(() => {
    fetchUsers();
    fetchEvents();
    fetchDonations();
    fetchReservations();
  }, [token]);

  const fetchUsers = async () => {
    try {
      const response = await fetch(`${backendRoute}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      const formattedUsers = data.map(user => ({
        ...user,
        role: getUserRole(user)
      }));
      setUsers(formattedUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchEvents = async () => {
    try {
      const response = await fetch(`${backendRoute}/donator/events`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      console.log(data)
      setEvents(data);
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  };

  const fetchDonations = async () => {
    try {
      const response = await fetch(`${backendRoute}/donations`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      console.log(data)
      setDonations(data.donations);
    } catch (error) {
      console.error('Error fetching donations:', error);
    }
  }

  const fetchReservations = async () => {
    try {
      const response = await fetch(`${backendRoute}/reservations`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      console.log('Original reservations:', data);
  
      const flattenedReservations = data.map(reservation => ({
        ...reservation,
        reservationItems: reservation.reservationItems.map(item => ({
          id: item.id,
          reservationId: item.reservationId,
          foodId: item.foodId,
          quantity: item.quantity,
          foodName: item.food.name,
          foodType: item.food.type,
          foodExpiryDate: item.food.expiryDate
        }))
      }));
  
      console.log('Flattened reservations:', flattenedReservations);
      setReservations(flattenedReservations);
    } catch (error) {
      console.error('Error fetching reservations:', error);
    }
  };

  const handleOpenModal = (row) => {
    setEditData(row);
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    let updatedValue = value;
    if (name === 'startDate' || name === 'endDate') {
      updatedValue = new Date(value).toISOString();
    }
    if (name === 'maxSlots') {
      updatedValue = parseInt(value, 10);
    }
    setEditData({ ...editData, [name]: updatedValue });
  };

  const handleSave = async () => {
    try {
      let endpoint;
      switch (activeTab) {
        case 0:
          endpoint = `users/${editData.id}`;
          break;
        case 1:
          endpoint = `events/update/${editData.id}`;
          break;
        case 2:
          endpoint = `donations/${editData.id}`;
          break;
        case 3:
          endpoint = `reservation/${editData.id}`;
          break;
        default:
          throw new Error('Invalid tab');
      }
  
      // Remove any file-related properties from editData
      const { imageFile, ...dataToSend } = editData;

      const response = await fetch(`${backendRoute}/${endpoint}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json', 
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(dataToSend)
      });
  
      if (response.ok) {
        switch (activeTab) {
          case 0:
            fetchUsers();
            break;
          case 1:
            fetchEvents();
            break;
          case 2:
            fetchDonations();
            break;
          case 3:
            fetchReservations();
            break;
        }
        setSnackbarOpen(true);
      }
    } catch (error) {
      console.error('Error updating item:', error);
    }
    handleCloseModal();
  };

  const handleDelete = async (id) => {
    try {
      let endpoint;
      switch (activeTab) {
        case 0:
          endpoint = `users/${id}`;
          break;
        case 1:
          endpoint = `events/${id}`;
          break;
        case 2:
          endpoint = `donations/${id}`;
          break;
        case 3:
          endpoint = `reservations/${id}`;
          break;
        default:
          throw new Error('Invalid tab');
      }
      const response = await fetch(`${backendRoute}/${endpoint}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        switch (activeTab) {
          case 0:
            fetchUsers();
            break;
          case 1:
            fetchEvents();
            break;
          case 2:
            fetchDonations();
            break;
          case 3:
            fetchReservations();
            break;
        }
      } else {
        console.error('Failed to delete item');
      }
    } catch (error) {
      console.error('Error deleting item:', error);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const renderModalContent = () => {
    switch (activeTab) {
      case 0:
        return (
          <>
            <TextField
              margin="normal"
              fullWidth
              id="name"
              label="Name"
              name="name"
              value={editData.name || ''}
              onChange={handleInputChange}
            />
            <TextField
              margin="normal"
              fullWidth
              id="email"
              label="Email"
              name="email"
              value={editData.email || ''}
              onChange={handleInputChange}
            />
          </>
        );
      case 1:
        return (
          <>
            {editData.images && editData.images.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle1">Current Image:</Typography>
              <img 
                src={`${backendRoute}${editData.images[0].url}`} 
                alt="Event" 
                style={{ maxWidth: '100%', maxHeight: '200px' }}
              />
            </Box>
          )}
          <input
            accept="image/*"
            style={{ display: 'none' }}
            id="raised-button-file"
            type="file"
            onChange={(e) => {
              const file = e.target.files[0];
              setEditData({ ...editData, imageFile: file });
            }}
          />
          <label htmlFor="raised-button-file">
            <Button variant="contained" component="span">
              {editData.images && editData.images.length > 0 ? 'Change Image' : 'Upload Image'}
            </Button>
          </label>
          <TextField
            margin="normal"
            fullWidth
            id="title"
            label="Title"
            name="title"
            value={editData.title || ''}
            onChange={handleInputChange}
          />
          <TextField
            margin="normal"
            fullWidth
            id="fullSummary"
            label="Full Summary"
            name="fullSummary"
            value={editData.fullSummary || ''}
            onChange={handleInputChange}
            multiline
            rows={4}
          />
          <TextField
            margin="normal"
            fullWidth
            id="phoneNumber"
            label="Phone Number"
            name="phoneNumber"
            value={editData.phoneNumber || ''}
            onChange={handleInputChange}
          />
          <TextField
            margin="normal"
            fullWidth
            id="emailAddress"
            label="Email Address"
            name="emailAddress"
            value={editData.emailAddress || ''}
            onChange={handleInputChange}
          />
          <TextField
            margin="normal"
            fullWidth
            id="startDate"
            label="Start Date"
            name="startDate"
            type="datetime-local"
            value={editData.startDate ? editData.startDate.slice(0, 16) : ''}
            onChange={handleInputChange}
            InputLabelProps={{
              shrink: true,
            }}
          />
          <TextField
            margin="normal"
            fullWidth
            id="endDate"
            label="End Date"
            name="endDate"
            type="datetime-local"
            value={editData.endDate ? editData.endDate.slice(0, 16) : ''}
            onChange={handleInputChange}
            InputLabelProps={{
              shrink: true,
            }}
          />
          <TextField
            margin="normal"
            fullWidth
            id="maxSlots"
            label="Max Slots"
            name="maxSlots"
            type="number"
            value={editData.maxSlots || ''}
            onChange={handleInputChange}
          />
          <TextField
            margin="normal"
            fullWidth
            id="attire"
            label="Attire"
            name="attire"
            value={editData.attire || ''}
            onChange={handleInputChange}
          />
        </>
        );
      case 2:
        return (
          <>
            <TextField
              margin="normal"
              fullWidth
              id="category"
              label="Category"
              name="category"
              value={editData.category || ''}
              onChange={handleInputChange}
            />
            <TextField
              margin="normal"
              fullWidth
              id="location"
              label="Location"
              name="location"
              value={editData.location || ''}
              onChange={handleInputChange}
            />
            <TextField
              margin="normal"
              fullWidth
              id="remarks"
              label="Remarks"
              name="remarks"
              value={editData.remarks || ''}
              onChange={handleInputChange}
            />
          </>
        );
      case 3:
        return (
          <>
          <TextField
            margin="normal"
            fullWidth
            id="collectionDate"
            label="Collection Date"
            name="collectionDate"
            type="date"
            value={editData.collectionDate ? editData.collectionDate.split('T')[0] : ''}
            onChange={handleInputChange}
            InputLabelProps={{
              shrink: true,
            }}
          />
          <TextField
            margin="normal"
            fullWidth
            id="collectionTimeStart"
            label="Collection Start Time"
            name="collectionTimeStart"
            type="time"
            value={editData.collectionTimeStart || ''}
            onChange={handleInputChange}
            InputLabelProps={{
              shrink: true,
            }}
          />
          <TextField
            margin="normal"
            fullWidth
            id="collectionTimeEnd"
            label="Collection End Time"
            name="collectionTimeEnd"
            type="time"
            value={editData.collectionTimeEnd || ''}
            onChange={handleInputChange}
            InputLabelProps={{
              shrink: true,
            }}
          />
          <FormControl fullWidth margin="normal">
            <InputLabel id="collectionStatus">Collection Status</InputLabel>
            <Select
              labelId="collectionStatus"
              id="collectionStatus"
              name="collectionStatus"
              value={editData.collectionStatus || ''}
              onChange={handleInputChange}
              label="Collection Status"
            >
              <MenuItem value="Uncollected">Uncollected</MenuItem>
              <MenuItem value="Pending">Pending</MenuItem>
              <MenuItem value="Collected">Collected</MenuItem>
            </Select>
          </FormControl>
          <TextField
            margin="normal"
            fullWidth
            id="remarks"
            label="Remarks"
            name="remarks"
            value={editData.remarks || ''}
            onChange={handleInputChange}
          />
        </>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <ThemeProvider theme={theme}>
      <AdminNavbar />
      <Container maxWidth='md'>
      <Box sx={{ width: '100%', bgcolor: 'background.paper' }}>
        <Tabs value={activeTab} onChange={handleTabChange} centered>
          <Tab label="Users" />
          <Tab label="Events" />
          <Tab label="Donations" />
          <Tab label="Reservations" />
        </Tabs>
      </Box>
      {activeTab === 0 && (
        <DataTable
          columns={userColumns}
          rows={users}
          onEdit={handleOpenModal}
          onDelete={handleDelete}
        />
      )}
      {activeTab === 1 && (
        <DataTable
          columns={eventColumns}
          rows={events}
          onEdit={handleOpenModal}
          onDelete={handleDelete}
        />
      )}
      {activeTab === 2 && (
        <DataTable
          columns={donationColumns}
          rows={donations}
          onEdit={handleOpenModal}
          onDelete={handleDelete}
          nestedConfig={donationNestedConfig}
        />
      )}
      {activeTab === 3 && (
        <DataTable
          columns={reservationColumns}
          rows={reservations}
          onEdit={handleOpenModal}
          onDelete={handleDelete}
          nestedConfig={reservationNestedConfig}
        />
      )}
      <Modal
        open={openModal}
        onClose={handleCloseModal}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 400,
          bgcolor: 'background.paper',
          borderRadius: '8px',
          boxShadow: 16,
          p: 4,
        }}>
          <Typography id="modal-modal-title" variant="h6" component="h2">
            Edit {activeTab === 0 ? 'User' : activeTab === 1 ? 'Event' : activeTab === 2 ? 'Donation' : 'Reservation'}
          </Typography>
          {renderModalContent()}
          <Button onClick={handleSave} variant="contained" sx={{ mt: 2 }}>
            Save
          </Button>
        </Box>
      </Modal>
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={5000}
        onClose={() => setSnackbarOpen(false)}
        message="Saved changes!"
      />
      </Container>
      </ThemeProvider>
    </>
  );
}