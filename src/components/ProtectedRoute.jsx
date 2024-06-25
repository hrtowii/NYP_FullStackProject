import React, {useContext} from 'react';
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

import { TokenContext } from '../utils/TokenContext';
import {Buffer} from "buffer"
function parseJwt(token) {
    var base64Payload = token.split('.')[1];
    var payload = Buffer.from(base64Payload, 'base64');
    return JSON.parse(payload.toString());
}

const ProtectedRoute = ({ children, allowedRoles }) => {
    const { token, updateToken } = useContext(TokenContext);
    if (!token) {
        console.log("No token")
        return <Navigate to="/login" />;
    }

    try {
        // const { payload } = jwtVerify(token, new TextEncoder().encode(process.env.JWT_SECRET));
        const payload = parseJwt(token)
        const userRole = payload.role;

        if (!allowedRoles.includes(userRole)) {
            return <Navigate to="/forbidden" />;
        }

        return children;
    } catch (error) {
        console.log(error);
        return <Navigate to="/login" />;
    }

};

export default ProtectedRoute;