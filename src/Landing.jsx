import { Link } from "react-router-dom";
import Navbar from "./components/Navbar";
import "./index.css"
import './Landing.css'

function MainButtons(props) {
  const color = props.color
  return (
    color=="primary" ? 
    <Link to="/signup">
    <div className="primaryButton">
      Get started
    </div>
    </Link>
    : 
    <Link to="/login">
      <div className="secondaryButton">
        Login
      </div>
    </Link>
  )
}

export default function Landing() {
  return <>
  <Navbar/>
  <div className="heroContent">
    <div className="contentLeft">
      <div className="heroText">
        <h1>Connecting your communities,</h1>
        <h1 className="heroGreen">one fridge at a time</h1>
      </div>
      <p>CommuniFridge ensures that your food will never be wasted.</p>
      <div className="buttons">
        <MainButtons color="primary"/>
        <MainButtons/>
      </div>
    </div>
    <div className="heroImages">
      <div className="leftSideImages">
        <img src="https://cdn.recyclopedia.sg/strapi-assets/large_community_fridge_31b0658c4b.jpg"/>
        <img src="https://cdn.recyclopedia.sg/strapi-assets/large_community_fridge_31b0658c4b.jpg"/>
      </div>
      <div className="rightSideImages">
        <img src="https://cdn.recyclopedia.sg/strapi-assets/large_community_fridge_31b0658c4b.jpg"/>
      </div>
    </div>
  </div>
  </>
}
