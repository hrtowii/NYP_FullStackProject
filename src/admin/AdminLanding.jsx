import React, {useContext, useEffect, useState} from 'react'
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
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

        </>
    )
}
