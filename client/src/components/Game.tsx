import React from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { GameType } from '../store/gameBoard/types';
import GameBoard from './GameBoard';
import { StartMode } from './types';

const Game = () => {
    const location = useLocation();
    const query = useQuery();
    let { gameId } = useParams<{gameId: string}>(); /*In case user joining a game*/
    let gameType: GameType | null = null;

    const path:string = location.pathname;
    if(path !== '/play' && !path.includes('/join')) {
        return (<h4>Not Found</h4>);
    }
    const startMode = path === '/play' ? StartMode.Start : StartMode.Join;
    switch(startMode) {
        case StartMode.Start: {
            let gameTypeStr = query.get("gameType");
            if(gameTypeStr === null){
                return (
                    <h4>Missing gameType query parameter</h4>
                );
            }
            let upperCaseStr: string = gameTypeStr.toUpperCase(); /*To make the query parameter case-insensitive*/
            if(!Object.values(GameType).includes(upperCaseStr as GameType)){
                return (
                    <h4>Invalid gameType: '{gameTypeStr}'</h4>
                );
            }
            gameType = gameTypeStr as GameType;
            break;
        }
        case StartMode.Join: {
            if(gameId == null || gameId.length === 0) {
                return (<h4>Not Found</h4>);
            }
            break;
        }
        default:
            throw new Error("Invalid start mode: "+startMode);
    }

    return (
        <div style={{marginTop: '70px', marginLeft: '12px', marginRight: '12px'}}>
            <GameBoard startMode={startMode} gameType={gameType} gameId={gameId}/>
        </div>
    );
};

function useQuery() {
    return new URLSearchParams(useLocation().search);
}

export default Game;