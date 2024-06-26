import React, {useContext, useEffect, useState} from 'react'
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TablePagination from '@mui/material/TablePagination';
import TableRow from '@mui/material/TableRow';
import { AdminNavbar } from '../components/Navbar';
import { TokenContext } from '../utils/TokenContext';
import { backendRoute } from '../utils/BackendUrl';
// admin page. Admins can:
// view all users
// delete any user
// update any user details
export default function AdminLanding() {
    const {token, setToken} = useContext(TokenContext)
    const [users, updateUsers] = useState([])
    useEffect(() => {
        fetch(`${backendRoute}/users`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', "Access-Control-Allow-Origin": "*", "Authorization": `Bearer ${token}` },
            // body: JSON.stringify({email: formData.email}),
        }).then((result) => {
            updateUsers(result)
            console.log(users)
        })
    }, [])
    return (
        <>
            <AdminNavbar/>
            <Box component="section" sx={{ p: 2, border: '1px dashed grey' }}>
                <TableHead>
                    <TableRow />
                    <TableRow />
                </TableHead>
            </Box>
        </>
    )
}
