import React from 'react';
import { useLocation } from 'react-router-dom';
import { GameType } from '../store/gameBoard/types';
import AppBar from './AppBar';
import GameBoard from './GameBoard';

const Game = () => {
    let query = useQuery();
    let gameTypeStr = query.get("gameType");
    if(gameTypeStr === null){
        throw new Error("gameType property cannot be null");
    }
    let gameType: GameType = gameTypeStr as GameType;
    console.log(gameType);
    return (
        <>
        <AppBar />
        <div style={{marginTop: '70px', marginLeft: '12px', marginRight: '12px'}}>
            <GameBoard gameType={gameType}/>
        </div>
        </>
    );
};

function useQuery() {
    return new URLSearchParams(useLocation().search);
}

export default Game;