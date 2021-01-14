import React from 'react';
import { connect } from 'react-redux';
import { GameBoardState, PointState} from '../store/gameBoard/types';
import { initGame } from '../store/gameBoard/actions'
import { ApplicationState} from '../store/index'
import GamePosition from './GamePosition';

interface StateProps {
    game: GameBoardState
}
interface DispatchProps {
    initGame: typeof initGame
}
interface OwnProps {
}
type Props = StateProps & DispatchProps & OwnProps;

function GameBoard(props: Props) {
    return (
        <>
            <GameHUD game={props.game} />
            <Board board={props.game.board} />
            <div className='container' style={{marginTop: 24}}>
                <div className='row justify-content-center'>
                    <button onClick={() => props.initGame()} className='btn btn-lg btn-primary'>RESET</button>
                </div>
            </div>
        </>
    );
}

function GameHUD(props: {game: GameBoardState}){
    let playerMessage = props.game.winner == null ? props.game.turn : `${props.game.winner} WINS !`;

    return(
        <h3 className='h2' style={{textAlign: 'center', marginBottom: '32px'}}>{playerMessage}</h3>
    );
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
        <div className="row justify-content-center" key={rowIndex}>
            {row}
        </div>
    );
}

function mapState(state: ApplicationState) : StateProps {
    return {
        game: state.game
    };
}
const mapDispatch : DispatchProps = {
    initGame: initGame
}
export default connect<StateProps, DispatchProps, OwnProps, ApplicationState>(
    mapState,
    mapDispatch
)(GameBoard)


