import React from 'react';
import { Link } from 'react-router-dom';
import './LandingPage.scss';

const LandingPage: React.FC = () => {
  return (
    <div className="landing-page">
      <div className="hero-section">
        <div className="logo-container">
          <div className="logo">
            <span className="gradient-text">Not a Doctor</span>
          </div>
        </div>
        
        <h1>AI-Powered Telemedicine. <span className="gradient-text">Human-Like Care.</span></h1>
        
        <p className="subtitle">
          Connect with our AI doctor for instant medical consultations, symptom analysis, 
          and personalized health guidance - available 24/7, without the wait.
        </p>
        
        <div className="cta-buttons">
          <Link to="/consult" className="primary-button">
            Start Consultation
          </Link>
          <Link to="/learn-more" className="secondary-button">
            Learn More
          </Link>
        </div>
      </div>
      
      <div className="academic-disclaimer">
        <div className="academic-disclaimer-content">
          <h3>Academic Experiment</h3>
          <p>
            This "Not a Doctor" project is developed by Medvisor Group as an academic experiment. 
            It is NOT a real medical device and should not be used for actual healthcare decisions. 
            This platform demonstrates the advancement of AI in healthcare for educational purposes only.
          </p>
        </div>
      </div>
      
      <div className="features-section">
        <div className="feature-card">
          <div className="feature-icon instant"></div>
          <h3>Instant Access</h3>
          <p>Connect with a medical AI without appointments or waiting rooms</p>
        </div>
        
        <div className="feature-card">
          <div className="feature-icon privacy"></div>
          <h3>Privacy First</h3>
          <p>Your health data stays private and secure with medical-grade encryption</p>
        </div>
        
        <div className="feature-card">
          <div className="feature-icon knowledge"></div>
          <h3>Medical Knowledge</h3>
          <p>Backed by up-to-date medical research and FDA-approved resources</p>
        </div>
        
        <div className="feature-card">
          <div className="feature-icon referral"></div>
          <h3>Smart Referrals</h3>
          <p>Get guided to in-person care when needed with clear next steps</p>
        </div>
      </div>
      
      <div className="info-section">
        <div className="info-content">
          <h2>How <span className="gradient-text">Not a Doctor</span> Works</h2>
          <div className="step-container">
            <div className="step">
              <div className="step-number">1</div>
              <h4>Start a Consultation</h4>
              <p>Launch a video consultation from any device, any time</p>
            </div>
            
            <div className="step">
              <div className="step-number">2</div>
              <h4>Discuss Your Symptoms</h4>
              <p>Talk naturally as you would with a human doctor</p>
            </div>
            
            <div className="step">
              <div className="step-number">3</div>
              <h4>Get Personalized Guidance</h4>
              <p>Receive evidence-based recommendations and clear next steps</p>
            </div>
          </div>
        </div>
        
        <div className="info-image">
          {/* Placeholder for application screenshot/mockup */}
        </div>
      </div>
      
      <div className="testimonials-section">
        <h2>What People Say</h2>
        <div className="testimonial-cards">
          <div className="testimonial-card">
            <p>"I was skeptical at first, but the guidance I received was clear and helpful. It recommended I see a specialist for what turned out to be an early-stage condition."</p>
            <div className="testimonial-author">- Michael R.</div>
          </div>
          
          <div className="testimonial-card">
            <p>"As someone with anxiety about doctor visits, this platform has been a game-changer. I can get initial guidance without the stress."</p>
            <div className="testimonial-author">- Sarah T.</div>
          </div>
          
          <div className="testimonial-card">
            <p>"The most impressive part was how it explained my medication interactions in a way my pharmacy never did."</p>
            <div className="testimonial-author">- David L.</div>
          </div>
        </div>
      </div>
      
      <div className="disclaimer-section">
        <div className="disclaimer-content">
          <h3>Important Health Disclaimer</h3>
          <p>
            Not a Doctor is an AI-powered health guidance tool and is not a substitute for professional medical advice, 
            diagnosis, or treatment. Always seek the advice of your physician or other qualified health provider with 
            any questions you may have regarding a medical condition.
          </p>
        </div>
      </div>
      
      <footer className="landing-footer">
        <div className="footer-logo">
          <span className="gradient-text">Not a Doctor</span>
        </div>
        <div className="footer-links">
          <a href="/privacy">Privacy Policy</a>
          <a href="/terms">Terms of Use</a>
          <a href="/contact">Contact Us</a>
        </div>
        <div className="footer-copyright">
          © {new Date().getFullYear()} Not a Doctor. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;