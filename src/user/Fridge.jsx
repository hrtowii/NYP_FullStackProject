import React, { useState, useEffect } from 'react';
import Navbar, { UserNavbar } from "../components/Navbar";
import "./Fridge.css"
import ReactOdometer from 'react-odometerjs';

const AnimatedCounter = ({ value }) => {
    const [displayValue, setDisplayValue] = useState(0);

    useEffect(() => {
        let start = displayValue;
        const end = value;
        const duration = 3000;  // 3s duration for animation
        let timer;

        const step = () => {
            const time = Math.min(1, (Date.now() - startTime) / duration);
            const currentValue = Math.floor(start + time * (end - start));
            setDisplayValue(currentValue);

            if (time < 1) {
                requestAnimationFrame(step);
            } else {
                setDisplayValue(end);
            }
        };

        const startTime = Date.now();
        timer = requestAnimationFrame(step);

        return () => cancelAnimationFrame(timer);
    }, [value]);

    return (
        <span className="animated-counter">
            {displayValue.toLocaleString()}
        </span>
    );
};

export default function Fridge() {
    const [fridgesCount, setFridgesCount] = useState(0);
    const [foodDonated, setFoodDonated] = useState(0);
    const [familiesSupported, setFamiliesSupported] = useState(0);

    useEffect(() => {
        // Set intitial value after short delay
        const timeoutId = setTimeout(() => {
            setFridgesCount(43);
            setFoodDonated(58978);
            setFamiliesSupported(15673);
        }, 100);

        return () => clearTimeout(timeoutId);
    }, []);

    useEffect(() => {
        const intervalId = setInterval(() => {
            const foodIncrement = Math.floor(Math.random() * 7) + 4;  // Random value (4-10)
            const familiesIncrement = Math.floor(Math.random() * 3) + 1;  // Random value (1-3)

            setFoodDonated(prevValue => prevValue + foodIncrement);
            setFamiliesSupported(prevValue => prevValue + familiesIncrement);
        }, 5000);  // 5000ms

        return () => clearInterval(intervalId);
    }, []);

    return (
        <>
            <UserNavbar />

            <div className="fridge-container">
                <div className="fridge-header">
                    <h1>Reducing Waste and Fostering Community</h1> <br></br>
                    <p>Welcome to the Community Fridge! Choose the food items you need and take them home!
                        Our fridge is stocked with fresh donations, ensuring that everyone has access to nuritious meals</p>
                </div>

                <div className="fridge-stats">
                    <div className="fridge-stat-item">
                        <ReactOdometer value={fridgesCount} />
                        <p>Self-Collect Fridges</p>
                    </div>
                    <div className="fridge-stat-item">
                        <ReactOdometer value={foodDonated} />
                        <p>Fresh Food Donated</p>
                    </div>
                    <div className="fridge-stat-item">
                        <ReactOdometer value={familiesSupported} />
                        <p>Families Supported</p>
                    </div>
                </div>

                <h2>Fridge</h2>
                {/* Display fridge table */}
                <p>// TODO: Display fridge table w sorting function + Add to cart button + set alert to only allow up to 5 reservations</p>
            </div>
        </>
    );
};