import React, { useEffect, useState } from 'react';
import { Badge, IconButton } from '@mui/material';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import { useNavigate } from 'react-router-dom';

const CartIcon = () => {
    const [cartItemCount, setCartItemCount] = useState(0);
    const navigate = useNavigate();

    useEffect(() => {
        const updateCartItemCount = () => {
            const cartItems = JSON.parse(localStorage.getItem('cartItems') || '[]');
            setCartItemCount(cartItems.length);
        };

        updateCartItemCount();
        window.addEventListener('storage', updateCartItemCount);

        return () => {
            window.removeEventListener('storage', updateCartItemCount);
        };
    }, []);

    const handleCartClick = () => {
        navigate('/user/cart');
    };

    return (
        <IconButton color="inherit" onClick={handleCartClick}>
            <Badge badgeContent={cartItemCount} color="error">
                <ShoppingCartIcon />
            </Badge>
        </IconButton>
    );
};

export default CartIcon;