import React from 'react';
import './LoadingSpinner.css'

const LoadingSpinner = () => {
    return (
        <div className="spinner-container">
            <div className="spinner-border spinner" style={{width: "4rem", height: "4rem", opacity: 1}} role="status">
            </div>
        </div>
    );
};

export default LoadingSpinner;