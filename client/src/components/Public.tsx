import React from 'react';
import AppBar from './AppBar';

const Public = () => {
    return (
        <>
        <AppBar />
        <div className="container-fluid" style={{marginTop: '120px'}}>
            <h2 className="text-center h3">It's Tic Tac Toe 2.0</h2>
            <div className="row justify-content-center mt-5">
                <button className="btn btn-primary btn-lg my-3">Find opponent</button>
                <button className="btn btn-primary btn-lg my-3 mx-5">Invite friend</button>
                <button className="btn btn-primary btn-lg my-3">Play with computer</button>
            </div>
        </div>
        </>
    );
};

export default Public;