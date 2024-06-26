import React, { useState, useEffect } from 'react';
import Navbar from "../components/Navbar";
import "./Cart.css"


export default function Cart() {
    return (
        <>
            <Navbar />

            <div className="cart-header">
                <h1>Shopping Cart</h1> <br></br>
                <p>[Display table of selected items below.]</p>
            </div>
        </>
    )
}


