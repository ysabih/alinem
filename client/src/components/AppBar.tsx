import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css'

export default function AppBar() {
  return (
    <nav className="navbar bg-light navbar-expand-lg fixed-top shadow-box shadow-sm d-flex" style={{height: '60px'}}>
        <div className="navbar-brand">
            <span className="h3">Alinem</span>
        </div>    
    </nav>
  );
}


