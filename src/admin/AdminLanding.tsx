import React, { useContext, useEffect, useState } from 'react'
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Modal,
  Box,
  Typography,
  TextField,
  Button,
  IconButton,
  Snackbar
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import { AdminNavbar } from '../components/Navbar';
import { TokenContext } from '../utils/TokenContext';
import { backendRoute } from '../utils/BackendUrl';
// admin page. Admins can:
// view all users
// delete any user
// update any user details
const getUserRole = (user) => {
  if (user.admin) return 'Admin';
  if (user.donator) return 'Donator';
  if (user.user) return 'User';
  return 'Unknown';
};
export default function AdminLanding() {
  // https://mui.com/material-ui/react-table/ for reference
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [openModal, setOpenModal] = useState(false);
  const [editData, setEditData] = useState({ id: '', name: '', email: '', role: '' });

  const { token, setToken } = useContext(TokenContext)
  const [users, updateUsers] = useState<any>([])
  const [columns, setColumns] = useState<any>([{ id: 'id', label: 'ID', minWidth: 50 },
    { id: 'name', label: 'Name', minWidth: 100 },
    { id: 'email', label: 'Email', minWidth: 170 },
    { id: 'role', label: 'Role', minWidth: 100 }]);
  const [rows, setRows] = useState<any>([]);
  useEffect(() => {
    fetch(`${backendRoute}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', "Access-Control-Allow-Origin": "*", "Authorization": `Bearer ${token}` },
      // body: JSON.stringify({email: formData.email}),
    }).then(async (result) => {
      const users: any[] = await result.json()
      updateUsers(users)
      // console.log(users)
    })
  }, [token]);

  useEffect(() => {
    const dynamicRows = users.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: getUserRole(user)
    }));
    setRows(dynamicRows);
    console.log(dynamicRows);
  }, [users]); // this is done because useState is asynchronous. so it will remain empty for a while until users is set properly
  
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(+event.target.value);
    setPage(0);
  };

  const handleOpenModal = (row) => {
    setEditData(row);
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
  };

  const handleInputChange = (event) => {
    setEditData({ ...editData, [event.target.name]: event.target.value });
  };

  const [snackbarOpen, setSnackbarOpen] = React.useState(false);


  const handleClose = (event: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbarOpen(false);
  };

  const snackbarAction = (
    <React.Fragment>
      <Button color="secondary" size="small" onClick={handleClose}>
        UNDO
      </Button>
      <IconButton
        size="small"
        aria-label="close"
        color="inherit"
        onClick={handleClose}
      >
        <CloseIcon fontSize="small" />
      </IconButton>
    </React.Fragment>
  );

  const handleSave = () => {
    fetch(`${backendRoute}/updateUser/${editData.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', "Access-Control-Allow-Origin": "*", "Authorization": `Bearer ${token}` },
      body: JSON.stringify(editData)
    }).then(async (result) => {
      if (result.ok) {
        setSnackbarOpen(true);
      }
    })
    handleCloseModal();
  };

  const handleDelete = (id: number) => {
    fetch(`${backendRoute}/deleteUser/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', "Access-Control-Allow-Origin": "*", "Authorization": `Bearer ${token}` },
    }).then(async (result) => {
      if (result.ok) {
        updateUsers(users.filter(user => user.id !== id));
      } else {
        console.error('Failed to delete user');
      }
    });
  };

  return (
    <>
    <AdminNavbar/>
    <Paper sx={{ width: '100%' }}>
      <TableContainer sx={{ maxHeight: 440 }}>
        <Table stickyHeader aria-label="sticky table">
          <TableHead>
            <TableRow>
              {columns.map((column) => (
                <TableCell
                  key={column.id}
                  style={{ minWidth: column.minWidth }}
                >
                  {column.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((row) => {
                return (
                  <TableRow hover role="checkbox" tabIndex={-1} key={row.id}>
                    {columns.map((column) => {
                      const value = row[column.id];
                      return (
                        <TableCell key={column.id}>
                            {column.id === 'actions' ? (
                              <IconButton onClick={() => handleDelete(row.id)}>
                                <DeleteIcon />
                              </IconButton>
                            ) : (
                              <div onClick={() => handleOpenModal(row)}>
                                {value}
                              </div>
                            )}
                          </TableCell>
                      );
                    })}
                  </TableRow>
                );
              })}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        rowsPerPageOptions={[10, 25, 100]}
        component="div"
        count={rows.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
      {/* MARK: edit user modal */}
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
          border: '2px solid #000',
          boxShadow: 24,
          p: 4,
        }}>
          <Typography id="modal-modal-title" variant="h6" component="h2">
            Edit User
          </Typography>
          <TextField
            margin="normal"
            fullWidth
            id="name"
            label="Name"
            name="name"
            value={editData.name}
            onChange={handleInputChange}
          />
          <TextField
            margin="normal"
            fullWidth
            id="email"
            label="Email"
            name="email"
            value={editData.email}
            onChange={handleInputChange}
          />
          <TextField
            margin="normal"
            fullWidth
            id="role"
            label="Role"
            name="role"
            value={editData.role}
            onChange={handleInputChange}
          />
          <Button onClick={handleSave} variant="contained" sx={{ mt: 2 }}>
            Save
          </Button>
        </Box>
      </Modal>
    </Paper>
    <Snackbar
        open={snackbarOpen}
        autoHideDuration={1000}
        onClose={handleClose}
        message="Saved changes!"
        action={snackbarAction}
      />
    </>
  )
}
