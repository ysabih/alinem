import React, { useState } from 'react';
import { connect } from 'react-redux';
import { GameBoardState, GameType, PlayerTurn, PlayerType, PointState} from '../store/gameBoard/types';
import { initGame } from '../store/gameBoard/actions'
import { ApplicationState} from '../store/index'
import GamePosition from './GamePosition';
import { UserState } from '../store/user/types';

interface StateProps {
    game: GameBoardState
    user: UserState
}
interface DispatchProps {
    initGame: typeof initGame
}
interface OwnProps {
    gameType: GameType
}
type Props = StateProps & DispatchProps & OwnProps;

function GameBoard(props: Props) {
    const [initialized, setInitialized] = useState(false);
    // Init game before first render
    if(!initialized){
        initGame(props.gameType);
        setInitialized(true);
    }
    return (
        <>
            <GameHUD game={props.game} user={props.user} />
            <Board board={props.game.board} />
            <div className='container' style={{marginTop: 24}}>
                <div className='row justify-content-center'>
                    <button onClick={() => props.initGame(props.gameType)} className='btn btn-lg btn-primary'>RESET</button>
                </div>
            </div>
        </>
    );
}

function GameHUD(props: StateProps){
    let playerNames = getPlayerDisplayNames(props);
    if(props.game.winner != null){
        let winnerName = props.game.winner === PlayerTurn.ONE ? playerNames[0] : playerNames[1];
        return(
            <h3 className='h2' style={{textAlign: 'center', marginBottom: '32px'}}>{winnerName} WINS!</h3>
        );
    }
    let playerTurn = props.game.turn;
    let playerCursorStyle = "2px solid";
    let playerOneBorder = playerTurn === PlayerTurn.ONE ? playerCursorStyle : "";
    let playerTwoBorder = playerTurn === PlayerTurn.TWO ? playerCursorStyle : "";
    return(
    <div className="container mb-5 mt-4 h-100">
    <div className="row flex-nowrap h-100 justify-content-center">
        <div className="col-sm-5 text-left p-2" style={{border: playerOneBorder, borderRadius: 8}}><span className="h4" style={{color: "red"}}>{playerNames[0]}</span></div>
        {/* <div className="col-sm text-center h4">{turnCount}</div> */}
        <div className="col-sm-5 text-right p-2" style={{border: playerTwoBorder, borderRadius: 8}}><span className="h4" style={{color: "blue"}}>{playerNames[1]}</span></div>
    </div>
    </div>
    );
}

function getPlayerDisplayNames(props: StateProps) : string[] {
    return props.game.playerTypes.map(element => {
        if(element === PlayerType.COMPUTER) {
            return "Computer"
        }
        if(element === PlayerType.LOCAL_HUMAN) {
            return "You"
        }
        //TODO: Implement getting remote player name
        throw new Error("Not implemented");
    })
}

function Board(props: {board: PointState[][]}) {
    let boardState = props.board;
    let rows = new Array(boardState.length);
    for(let i = 0; i<boardState.length; i++){
        rows[i] = Row(i, boardState[i].length);
    }
    return (
        <div className='container'>
            {rows}
        </div>
    );
}

function Row(rowIndex: number, rowLength: number) {
    let row = new Array(rowLength);
    for(let i = 0; i < row.length; i++){
        row[i] = <GamePosition 
                    position={{x: i, y: rowIndex}}
                    key={`${i}${rowIndex}`} />
    }

    return (
        <div className="row flex-nowrap justify-content-center" key={rowIndex}>
            {row}
        </div>
    );
}

function mapState(state: ApplicationState) : StateProps {
    return {
        game: state.game,
        user: state.user
    };
}
const mapDispatch : DispatchProps = {
    initGame: initGame
}
export default connect<StateProps, DispatchProps, OwnProps, ApplicationState>(
    mapState,
    mapDispatch
)(GameBoard)


