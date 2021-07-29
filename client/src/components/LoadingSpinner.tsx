import React from 'react';
import './LoadingSpinner.css'

interface Props {
    message: string
}

const LoadingSpinner = (props: Props) => {
    return (
        <div className="spinner-container">
            <h3>{props.message}</h3>
            <div className="spinner-border spinner" style={{width: "4rem", height: "4rem", opacity: 1}} role="status">
            </div>
        </div>
    );
};

export default LoadingSpinner;