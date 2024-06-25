import React, { useState, useEffect } from 'react';
import Navbar from "./components/Navbar";
import "./Fridge.css"

const AnimatedCounter = ({ endValue, duration = 2000, prefix = '', suffix = '' }) => {
    const [count, setCount] = useState(0);

    useEffect(() => {
        let start = 0;
        const end = parseInt(endValue);
        if (start === end) return;

        const incrementTime = (duration / end) * 1000;
        let timer = setInterval(() => {
            start += 1;
            setCount(start);
            if (start === end) clearInterval(timer);
        }, incrementTime);

        return () => clearInterval(timer);
    }, [endValue, duration]);

    return (
        <span className="animated-counter">
            {prefix}
            {count.toLocaleString()}
            {suffix}
        </span>
    );
};

export default function Fridge() {
    return (
        <>
            <Navbar />

            <div className="fridge-container">
                <div className="fridge-header">
                    <h1>Reducing Waste and Fostering Community</h1> <br></br>
                    <p>Welcome to the Community Fridge! Choose the food items you need and take them home!
                        Our fridge is stocked with fresh donations, ensuring thsat everyone has access to nuritious meals</p>
                </div>

                <div className="fridge-stats">
                    <div className="fridge-stat-item">
                        <AnimatedCounter endValue={43} duration={1500} />
                        <p>Self-Collect Fridges</p>
                    </div>
                    <div className="fridge-stat-item">
                        <AnimatedCounter endValue={45890} duration={2000} />
                        <p>Fresh Food Donated</p>
                    </div>
                    <div className="fridge-stat-item">
                        <AnimatedCounter endValue={15344} duration={1800} />
                        <p>Families Supported</p>
                    </div>
                </div>

                <h2>Fridge</h2>
                {/* Display fridge table */}
            </div>
        </>
    );
};