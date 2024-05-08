import React from 'react';
import { jwtVerify } from 'jose'; // we use jose instead of jsonwebtoken in the browser, because of this issue https://www.thecodingcouple.com/uncaught-typeerror-util-inherits-is-not-a-function/
import { Navigate, useLocation } from 'react-router-dom';
// NOTE: all routes that need authentication will go through here for JWT validation. 
// essentially a shitty middleware because I don't have the luxury of nextJS

// There are 3 cases:
// 1. Token doesn't exist
// 2. Token is not allowed to enter this route
// 3. Token is broken somehow and errors out

// children: the actual component obviously
// allowedRoles: donator || user

const ProtectedRoute = ({ children, allowedRoles }) => {
    const location = useLocation();
    // get from our token our user role
    const cookies = document.cookie.split(';');
    const tokenCookie = cookies.find(cookie => cookie.trim().startsWith('token='));
    const token = tokenCookie ? tokenCookie.split('=')[1] : null;

    if (!token) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    try {
        const { payload } = jwtVerify(token, new TextEncoder().encode(process.env.JWT_SECRET));
        const userRole = payload.role;

        if (!allowedRoles.includes(userRole)) {
            return <Navigate to="/forbidden" state={{ from: location }} replace />;
        }

        return children;
    } catch (error) {
        console.log(e);
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

};

export default ProtectedRoute;