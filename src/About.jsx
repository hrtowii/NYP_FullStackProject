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

export default function About() {
  const [value, setValue] = useState(0);
  useEffect(() => {
      const timeoutId = setTimeout(() => setValue(31238), 100);
      return () => {
          clearTimeout(timeoutId);
      };
  }, []);
  // runs every 5 seconds to increment the counter value
  useEffect(() => {
    const intervalId = setInterval(() => {
      const incrementValue = Math.floor(Math.random() * 7) + 4; // Random value between 4 and 10
      setValue(prevValue => prevValue + incrementValue);
    }, 5000); // 5 seconds

    return () => clearInterval(intervalId);
  }, []);
  return (
    <>
    <Navbar/>
    <div className="content">
            <h2 className="heroGreen">Connecting Your Kindness, Empowering Communities</h2>
            <div style={{display: 'flex', gap: '10%', alignItems: 'center'}}>
                <div style={{width: '50%'}}>
                    <p>We believe in a Singapore where everyone has access to the food they need to thrive. That's why we created <b>CommuniFridge</b>, a community-driven app connecting individuals with <b>excess food</b> to those facing <b>food insecurity</b>.</p>
                </div>
                <div style={{width: '50%'}}>
                    <img style={{width: '100%'}} class="roundedimg" src="/vegetables.png"></img>
                </div>
            </div>

            <h2 style={{marginBlock: "0px"}}>Our Mission</h2>
            <ul>
              <li><b>Reduce food waste:</b> We aim to minimize the environmental impact of discarded food by providing a convenient way for individuals and businesses to donate unwanted, yet edible, items.</li>
              <li><b>Empower communities:</b> We promote self-sufficiency and dignity by creating a platform where anyone can easily access essential food items.</li>
              <li><b>Build connections:</b> We foster a spirit of collaboration and compassion by creating a network of community fridges and users who share and support each other.</li>
            </ul>
            <h2>How does it work?</h2>
      <div style={{display: "flex"}}>
        <div id="gridleft" class="gridthings">
            <h3>Donors</h3>
            <ul>
              <li><b>List your unwanted food:</b> Simply upload photos and descriptions of items you wish to donate (within expiry dates and following safety guidelines).</li>
              <li><b>Choose a community fridge:</b> Select the fridge closest to you or most convenient for pick-up.</li>
              <li><b>Track your impact:</b> See how your contributions have helped reduce food waste and support your community.</li>
            </ul>
        </div>
        <div id="gridright" class="gridthings">
            <h3>Recipients</h3>
            <ul>
              <li><b>Browse available items:</b> Explore a variety of food options across multiple community fridges in Singapore.</li>
              <li><b>Reserve your needs:</b> Secure items before they're gone, ensuring you get the food you want.</li>
              <li><b>Pick up with ease:</b> Collect your reserved items at the chosen fridge location without any cost or obligation.</li>
            </ul>
        </div>
    </div>
    <h2>Why CommmuniFridge?</h2>
    <div style={{display: "flex"}}>
        <Box title="Transparency and Trust" text="We ensure clear communication and food safety guidelines for all donations and reservations."/>
        <Box title="Accessibility and Convenience" text="Our app is user-friendly and accessible for everyone, regardless of technical skills."/>
        <Box title="Community-Driven Impact" text="Every donation and reservation makes a difference, directly impacting lives and the environment."/>
    </div>
    <div className="cssanimation sequence fadeInBottom" style={{display: "flex", flexDirection: "column", alignItems: "center"}}>
      <h2 style={{marginBlock: "10px"}}>There have been</h2>
      <h3 style={{marginBlock: "10px"}}>
        <ReactOdometer value={value} format="(,ddd),dd"/>
      </h3>
      <p>donations since 2000</p>
    </div>
</div>
    </>
  )
}
