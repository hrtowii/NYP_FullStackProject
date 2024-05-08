import React from 'react'
import Navbar from "./components/Navbar";
import "./index.css"
import './About.css'
export default function About() {
  return (
    <>
    <Navbar/>
    <div class="content">
            <h2>Connecting Your Kindness, Empowering Communities</h2>
            <div style={{display: 'flex', gap: '10%', alignItems: 'center'}}>
                <div style={{width: '50%'}}>
                    <p>We believe in a Singapore where everyone has access to the food they need to thrive. That's why we created <b>CommuniFridge</b>, a community-driven app connecting individuals with <b>excess food</b> to those facing <b>food insecurity</b>.</p>
                </div>
                <div style={{width: '50%'}}>
                    <img style={{width: '100%'}} class="roundedimg" src="/vegetables.png"></img>
                </div>
            </div>

            <h2>Our Mission</h2>
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
    <div class="horizontalol">
        <h2>Why CommmuniFridge?</h2>
        <ol>
          <li><b>Transparency and Trust</b> We ensure clear communication and food safety guidelines for all donations and reservations.</li>
          <li><b>Accessibility and Convenience</b> Our app is user-friendly and accessible for everyone, regardless of technical skills.</li>
          <li><b>Community-Driven Impact</b> Every donation and reservation makes a difference, directly impacting lives and the environment.</li>
        </ol>
    </div>

    <h2>Join the Movement:</h2>
    <p>Download <b>CommmuniFridge</b> today and be a part of building a more inclusive and sustainable Singapore. <b>Donate, reserve, and share</b> your experience to create a ripple effect of kindness and empower your community.</p>
    <p><b>Together, we can ensure that everyone has access to the nourishment they deserve.</b></p>
</div>
    </>
  )
}
