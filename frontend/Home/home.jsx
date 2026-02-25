import React from 'react';
import { Link } from 'react-router-dom';
import './home.css';
import SLIIT1 from './SLIIT-Building.jpg';
import halls from './sliit-metro-campus-facilities-7.jpg';

const Home = () => {
    return (
        <div className="home-container">
            <section className="hero-section">
                <div className="hero-images">
                    <div className="hero-image-left">
                        <img src={SLIIT1} alt="SLIIT Campus" />
                    </div>
                    <div className="hero-image-right">
                        <img src={halls} alt="SLIIT Overview" />
                    </div>
                </div>
                <div className="hero-overlay">
                    <div className="hero-title">
                        Driven by Algorithms. Designed for SLIIT.
                        </div><br />
                        <div className="hero-subtitle1">
                        Revolutionizing Academic Scheduling at SLIIT Through Intelligent Automation.
                        </div>
                        <div className="hero-subtitle">
                        <Link to="/register" className="nav-btn register-btn">Get Started</Link>
                        </div>
                </div>
                <div className="hero-content">
                </div>
            </section>
        </div>
    );
}

export default Home;

