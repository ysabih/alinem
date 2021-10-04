import React from "react";
import { connect } from "react-redux";
import { backendService } from "../server/backendService";
import { GameActionRequest } from "../server/types";
import { ApplicationState } from "../store";
import { addPiece, applyGameState, movePiece, selectPiece } from "../store/gameBoard/actions";
import { GameMode, GameState, PlayerTurn, Point, PointState } from "../store/gameBoard/types";
import { setBlockingUI } from "../store/ui/actions";
import { UserState } from "../store/user/types";
import { handleGameActionNotification, runBlockingAsync } from "../utils/componentHelpers";
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
    let piece: PointState = props.game.boardState.board[props.position.y][props.position.x];
    let playable: boolean = isPlayable(props.game.boardState, props.position);
    let clickable: boolean = props.playable && playable;
    
    let positionColor: string = getPositionColor(props, clickable, playable, piece == null);
    let pieceColor: string = getPieceColor(piece);

    return (
        <button className='btn btn-link' 
                style={{borderStyle: 'solid', borderWidth: 2, borderColor: 'grey', borderRadius: 0, backgroundColor: positionColor}} 
                disabled={!clickable} 
                onClick={() => onPositionClicked(props)}>
        <svg height={size} width={size} visibility = {piece? 'visible' : 'hidden'} >
            <circle cx={size/2} cy={size/2} r={size*2/5} stroke="black" strokeWidth={3} fill={pieceColor}/>
        </svg>          
        </button>
    );
}

enum PositionColor {
    Empty = 'transparent',
    Playable = '#d2ffb8',
    Selected = '#9ee7ff'
}

enum PieceColor {
    Player1 = 'red',
    Player2 = 'blue',
}

function getPositionColor(props: Props, clickable: boolean, playable: boolean, empty: boolean): string {
    switch(props.game.boardState?.gameMode) {
        case GameMode.PUT: {
            // make it a playable if empty and clickable
            return clickable ? PositionColor.Playable : PositionColor.Empty
        }
        case GameMode.MOVE: {
            let selectedPosition = props.game.boardState.selected;
            let selected: boolean = selectedPosition != null 
                                    && selectedPosition.x === props.position.x && selectedPosition.y === props.position.y;
            if(selected) return PositionColor.Selected;
            return playable && empty? PositionColor.Playable : PositionColor.Empty;
        }
        default: {
            return '';
        }
    }
}

function getPieceColor(piece: PointState): string {
    if(piece == null) return '';
    return piece === PlayerTurn.ONE ? PieceColor.Player1 : PieceColor.Player2;
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
                handleGameActionNotification(response, props.selectPiece, props.applyGameState, false);

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
                    handleGameActionNotification(response, props.selectPiece, props.applyGameState, false);
                       
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

