import React from "react";
import { connect } from "react-redux";
import { ApplicationState } from "../store";
import { addPiece, movePiece, selectPiece } from "../store/gameBoard/actions";
import { GameBoardState, GameMode, PlayerTurn, Point, PointState } from "../store/gameBoard/types";
import { isPlayable, getPositionState } from "../utils/gameRulesHelpers";

interface StateProps {
    game: GameBoardState
}
interface DispatchProps {
    addPiece: typeof addPiece,
    movePiece: typeof movePiece,
    selectPiece: typeof selectPiece
}
interface OwnProps {
    key: string,
    position: Point,
}
type Props = StateProps & DispatchProps & OwnProps;

function GamePosition(props: Props) {
    const size = 100;
    let state: PointState = props.game.board[props.position.y][props.position.x];
    let playable: boolean = isPlayable(props.game, props.position);
    const color = getPositionColor(state, playable);

    return (
        <button className='btn btn-link' 
                style={{borderRadius: '50%', borderStyle: 'solid'}} 
                disabled={!playable} 
                onClick={() => onPositionClicked(props)}>
        <svg height={size} width={size}>
            <circle cx={size/2} cy={size/2} r={size*2/5} stroke="black" strokeWidth={3} fill={color}/>
        </svg>
        </button>
    );
}

enum PositionColor {
    Empty = 'transparent',
    EmptyPlayable = '#d2ffb8',
    PlayerOne = 'red',
    PlayerTwo = 'blue'
}

function getPositionColor(point: PointState, playable: boolean): PositionColor{
    if(point == null) {
        return playable ? PositionColor.EmptyPlayable : PositionColor.Empty;
    }
    if(point === PlayerTurn.ONE) return PositionColor.PlayerOne;
    return PositionColor.PlayerTwo;
}

function onPositionClicked(props: Props){
    switch(props.game.gameMode) {
        case GameMode.PUT: {
            props.addPiece(props.position);
            break;
        }
        case GameMode.MOVE: {
            if(getPositionState(props.game.board, props.position) === props.game.turn){
                props.selectPiece(props.position);
            }
            else {
                // make move
                if(props.game.selected == null){
                    throw new Error("Error, empty position clicked in MOVE mode while no piece is selected");
                }
                props.movePiece(props.game.selected, props.position)
            }
        }
    }
}

function mapState(state: ApplicationState) : StateProps {
    return {
        game: state.game
    };
}
const mapDispatch : DispatchProps = {
    addPiece: addPiece,
    movePiece: movePiece,
    selectPiece: selectPiece
}
export default connect<StateProps, DispatchProps, OwnProps, ApplicationState>(
    mapState,
    mapDispatch
)(GamePosition)

