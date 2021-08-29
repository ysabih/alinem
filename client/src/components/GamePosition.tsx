import React from "react";
import { connect } from "react-redux";
import { backendService } from "../server/backendService";
import { GameActionRequest } from "../server/types";
import { ApplicationState } from "../store";
import { addPiece, applyGameState, movePiece, selectPiece } from "../store/gameBoard/actions";
import { GameMode, GameState, PlayerTurn, Point, PointState } from "../store/gameBoard/types";
import { setBlockingUI } from "../store/ui/actions";
import { UserState } from "../store/user/types";
import { runBlockingAsync } from "../utils/componentHelpers";
import { isPlayable, getPositionState } from "../utils/gameRulesHelpers";

interface StateProps {
    user: UserState,
    game: GameState
}
interface DispatchProps {
    addPiece: typeof addPiece,
    movePiece: typeof movePiece,
    selectPiece: typeof selectPiece,
    applyGameState: typeof applyGameState,
    setBlockingUI: typeof setBlockingUI
}
interface OwnProps {
    key: string,
    position: Point,
    playable: boolean
}
type Props = StateProps & DispatchProps & OwnProps;

function GamePosition(props: Props) {
    const size = 100;
    if(props.game.boardState == null) {
        throw new Error("Board state must not be null while game stage is "+props.game.stage);
    }
    let state: PointState = props.game.boardState.board[props.position.y][props.position.x];
    let playable: boolean = props.playable && isPlayable(props.game.boardState, props.position);
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

async function onPositionClicked(props: Props){
    if(props.game.boardState == null) {
        throw new Error("Board state must not be null while game stage is "+props.game.stage);
    }
    switch(props.game.boardState.gameMode) {
        case GameMode.PUT: {
            props.addPiece(props.position);
            // TODO: send action to server and apply server response
            runBlockingAsync(async () => {
                let gameActionRequest: GameActionRequest = {
                    gameId: props.game.id,
                    action: {
                        position: props.position
                    }
                }
                let response = await backendService.sendGameActionAsync(gameActionRequest);
                if(!response){
                    throw new Error("Expected non-falsy reponse from server, response: "+ response);
                }
                console.debug("Received new board state from server: ", response);
                props.applyGameState(response.newGameState);

            }, "Sending move...", props.setBlockingUI);
            break;
        }
        case GameMode.MOVE: {
            if(getPositionState(props.game.boardState.board, props.position) === props.game.boardState.currentTurn){
                props.selectPiece(props.position);
            }
            else {
                // make move
                if(props.game.boardState.selected == null){
                    throw new Error("Error, empty position clicked in MOVE mode while no piece is selected");
                }
                let from: Point = props.game.boardState.selected;
                let to: Point = props.position;
                
                props.movePiece(props.game.boardState.selected, props.position);
                runBlockingAsync(async () => {
                    let gameActionRequest: GameActionRequest = {
                        gameId: props.game.id,
                        action: {
                            from: from,
                            to: to
                        }
                    }
                    let response = await backendService.sendGameActionAsync(gameActionRequest);
                    if(!response){
                        throw new Error("Expected non-falsy reponse from server, response: "+ response);
                    }
                    console.debug("Received new board state from server: ", response);
                    props.applyGameState(response.newGameState);
                       
                }, "Sending move...", props.setBlockingUI);
            }
            break;
        }
    }
}

function mapState(state: ApplicationState) : StateProps {
    return {
        user: state.user,
        game: state.game
    };
}
const mapDispatch : DispatchProps = {
    addPiece: addPiece,
    movePiece: movePiece,
    selectPiece: selectPiece,
    applyGameState: applyGameState,
    setBlockingUI: setBlockingUI
}
export default connect<StateProps, DispatchProps, OwnProps, ApplicationState>(
    mapState,
    mapDispatch
)(GamePosition)

