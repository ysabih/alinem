import { isWinner, checkValidMove, checkValidPut, getPositionState } from '../../utils/gameRulesHelpers';
import {PutPieceAction, GameAction, GameActionType, 
        GameBoardState, GameMode, MovePieceAction, PlayerTurn, PointState, SelectPieceAction, ApplyServerStateAction, GameState, UserConnectionState} from './types';

const BOARD_ROW_LENGTH = 3;

const vsComputerInitialState: GameState = {
    id: null,
    startTimtUtc: null,
    player1: null,
    player2: null,
    userConnectionsState: [
        UserConnectionState.NOT_CONNECTED,
        UserConnectionState.NOT_CONNECTED
    ],
    boardState: {
        currentTurn: null,
        winner: null,
        turnNumber: 1,
        board: [[null, null, null], [null, null, null], [null, null, null]],
        gameMode: GameMode.PUT,
        selected: null,
    }
}

export function gameReducer(state: GameState = vsComputerInitialState, action: GameAction): GameState {
    switch(action.type){
        case GameActionType.ADD_PIECE : {
            if(state.boardState.gameMode !== GameMode.PUT){
                throw new Error(`Cannot add have more than ${BOARD_ROW_LENGTH} per player`);
            }
            // Check if valid move
            let newPieceAction = action as PutPieceAction;
            checkValidPut(state.boardState, newPieceAction);

            let updatedBoard: PointState[][] = calculateBoardOnPut(state.boardState, newPieceAction);
            let win: boolean = isWinner(updatedBoard, state.boardState.currentTurn);
            let nextTurn: number = win ? state.boardState.turnNumber : state.boardState.turnNumber + 1;
            let nextPlayer: PlayerTurn | null = win ? state.boardState.currentTurn : other(state.boardState.currentTurn);
            return  {
                ...state,
                boardState: {
                    ...state.boardState,
                    turnNumber: nextTurn,
                    winner: win ? state.boardState.currentTurn : null,
                    currentTurn: nextPlayer,
                    board: updatedBoard,
                    gameMode: nextTurn > BOARD_ROW_LENGTH * 2 ? GameMode.MOVE : GameMode.PUT,
                }
            }
        }

        case GameActionType.MOVE_PIECE: {
            if(state.boardState.turnNumber < BOARD_ROW_LENGTH  * 2) {
                throw new Error(`Cannot move pieces before each player has put ${BOARD_ROW_LENGTH} pieces`)
            }
            let moveAction = action as MovePieceAction;
            checkValidMove(state.boardState, moveAction);
            let updatedBoard: PointState[][] = calculateBoardOnMove(state.boardState, moveAction);
            let win: boolean = isWinner(updatedBoard, state.boardState.currentTurn);
            let nextTurn: number = win ? state.boardState.turnNumber : state.boardState.turnNumber + 1;
            let nextPlayer: PlayerTurn | null = win ? state.boardState.currentTurn : other(state.boardState.currentTurn);
            return {
                ...state,
                boardState: {
                    ...state.boardState,
                    turnNumber: nextTurn,
                    winner: win ? state.boardState.currentTurn : null,
                    currentTurn: nextPlayer,
                    board: updatedBoard,
                    gameMode: nextTurn > BOARD_ROW_LENGTH * 2 ? GameMode.MOVE : GameMode.PUT,
                    selected: null
                }
            }
        }

        case GameActionType.SELECT_PIECE: {
            let selectAction = action as SelectPieceAction;
            let positionState = getPositionState(state.boardState.board, selectAction.position);
            if(positionState == null){
                throw new Error("Cannot select an empty position");
            }
            if(positionState !== state.boardState.currentTurn){
                throw new Error(`Cannot select a ${positionState} piece on ${state.boardState.currentTurn}'s turn`);
            }
            return {
                ...state,
                boardState: {
                    ...state.boardState,
                    selected: selectAction.position
                }
            }
        }

        case GameActionType.APPLY_SERVER_STATE : {
            let updateAction = action as ApplyServerStateAction;
            // No need to perform any validation on new server state
            // It's safe not to remember the selected piece for now
            return updateAction.newState;
        }

        default:
            return state;
    }
}

function calculateBoardOnMove(state: GameBoardState, move: MovePieceAction): PointState[][] {
    let result = clone(state.board);
    result[move.from.y][move.from.x] = null;
    result[move.to.y][move.to.x] = state.currentTurn;
    return result;
}

function calculateBoardOnPut(state: GameBoardState, put: PutPieceAction): PointState[][] {
    let result = clone(state.board);
    result[put.position.y][put.position.x] = state.currentTurn;
    return result;
}

function clone(array: PointState[][]): PointState[][] {
    let len = array.length;
    let copy = new Array(len);
    for(let i=0; i<array.length; i++){
        copy[i] = array[i].slice();
    }
    return copy;
}

function other(player: PlayerTurn | null){
    if(player == null){
        return null;
    }
    return player === PlayerTurn.ONE ? PlayerTurn.TWO : PlayerTurn.ONE;
}