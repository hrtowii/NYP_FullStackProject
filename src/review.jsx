import React, {useState, useEffect} from 'react'
import Navbar from "./components/Navbar";
import "./index.css"
import './About.css'
import './assets/odometer.css'
import ReactOdometer from 'react-odometerjs';

function Box(props) {
    return (<div className="ourBox">
        <h4>{props.title}</h4>
        {props.text}
    </div>)
}

export default function Review() {
    return(
        <>
        <Navbar/>
        <div style={{display: 'flex', gap: '10%', alignItems: 'center'}}>
            <Box title="Transparency and Trust" text="We ensure clear communication and food safety guidelines for all donations and reservations."/>
            <Box title="Accessibility and Convenience" text="Our app is user-friendly and accessible for everyone, regardless of technical skills."/>
            <Box title="Community-Driven Impact" text="Every donation and reservation makes a difference, directly impacting lives and the environment."/>
        </div>
    </>)
}