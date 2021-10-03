import React from 'react';
import { Link } from 'react-router-dom';
import { GameType } from '../store/gameBoard/types';

const Home = () => {
    return (
        <>
        <div className="container-fluid" style={{marginTop: '120px'}}>
            <h2 className="text-center h3">It's Tic Tac Toe 2.0</h2>
            <div className="row justify-content-center mt-5">
                <Link className="btn btn-primary btn-lg my-3" to={`play?gameType=${GameType.VS_RANDOM_PLAYER}`}>Find opponent</Link>
                <Link className="btn btn-primary btn-lg my-3 mx-5" to={`play?gameType=${GameType.VS_FRIEND}`}>Invite friend</Link>
                <Link className="btn btn-primary btn-lg my-3" to={`play?gameType=${GameType.VS_COMPUTER}`}>Play with computer</Link>
            </div>
        </div>
        </>
    );
};

export default Home;