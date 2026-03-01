import { useNavigate } from "react-router-dom";

import building from "../src/assets/SLIIT-Building.jpg";
import campus from "../src/assets/sliit-metro-campus-facilities-7.jpg";
import "./home.css";

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="home-bg-container">
      <div className="home-bg-images">
        <img src={building} alt="SLIIT Building" className="bg-image left-bg" />
        <img src={campus} alt="SLIIT Campus Facilities" className="bg-image right-bg" />
      </div>
      <div className="home-overlay-content">
        <div className="home-hero">
          <h1>Driven by Algorithms</h1>
          <p>Designed for SLIIT</p>
        </div>
        <div className="home-cta">
          <button 
            className="cta-button" 
            onClick={() => navigate("/login")}
          >
            Get Started
          </button>
        </div>
      </div>
    </div>
  );
}
