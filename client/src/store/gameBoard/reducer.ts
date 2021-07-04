import { isWinner, checkValidMove, checkValidPut, getPositionState } from '../../utils/gameRulesHelpers';
import {PutPieceAction, GameBoardAction, GameBoardActionType, 
        GameBoardState, GameMode, MovePieceAction, PlayerTurn, PointState, SelectPieceAction, PlayerType} from './types';

const BOARD_ROW_LENGTH = 3;

const vsComputerInitialState: GameBoardState = {
    playerTypes: [PlayerType.LOCAL_HUMAN, PlayerType.COMPUTER],
    turn: PlayerTurn.ONE,
    winner: null,
    turnCount: 1,
    board: [[null, null, null], [null, null, null], [null, null, null]],
    gameMode: GameMode.PUT,
    selected: null,
}

export function gameBoardReducer(state: GameBoardState = vsComputerInitialState, action: GameBoardAction): GameBoardState {
    switch(action.type){
        case GameBoardActionType.ADD_PIECE : {
            if(state.gameMode !== GameMode.PUT){
                throw new Error(`Cannot add have more than ${BOARD_ROW_LENGTH} per player`);
            }
            // Check if valid move
            let newPieceAction = action as PutPieceAction;
            checkValidPut(state, newPieceAction);

            let updatedBoard: PointState[][] = calculateBoardOnPut(state, newPieceAction);
            let win: boolean = isWinner(updatedBoard, state.turn);
            let nextTurn: number = win ? state.turnCount : state.turnCount + 1;
            let nextPlayer: PlayerTurn = win ? state.turn : other(state.turn);
            return  {
                ...state,
                turnCount: nextTurn,
                winner: win ? state.turn : null,
                turn: nextPlayer,
                board: updatedBoard,
                gameMode: nextTurn > BOARD_ROW_LENGTH * 2 ? GameMode.MOVE : GameMode.PUT,
                selected: state.selected
            }
        }

        case GameBoardActionType.MOVE_PIECE: {
            if(state.turnCount < BOARD_ROW_LENGTH  * 2) {
                throw new Error(`Cannot move pieces before each player has put ${BOARD_ROW_LENGTH} pieces`)
            }
            let moveAction = action as MovePieceAction;
            checkValidMove(state, moveAction);
            let updatedBoard: PointState[][] = calculateBoardOnMove(state, moveAction);
            let win: boolean = isWinner(updatedBoard, state.turn);
            let nextTurn: number = win ? state.turnCount : state.turnCount + 1;
            let nextPlayer: PlayerTurn = win ? state.turn : other(state.turn);
            return {
                ...state,
                turnCount: nextTurn,
                winner: win ? state.turn : null,
                turn: nextPlayer,
                board: updatedBoard,
                gameMode: nextTurn > BOARD_ROW_LENGTH * 2 ? GameMode.MOVE : GameMode.PUT,
                selected: null
            }
        }

        case GameBoardActionType.SELECT_PIECE: {
            let selectAction = action as SelectPieceAction;
            let positionState = getPositionState(state.board, selectAction.position);
            if(positionState == null){
                throw new Error("Cannot select an empty position");
            }
            if(positionState !== state.turn){
                throw new Error(`Cannot select a ${positionState} piece on ${state.turn}'s turn`);
            }
            return {
                ...state,
                selected: selectAction.position
            }
        }

        case GameBoardActionType.INIT : {
            return vsComputerInitialState;
        }
        
        default:
            return state;
    }
}

function calculateBoardOnMove(state: GameBoardState, move: MovePieceAction): PointState[][] {
    let result = clone(state.board);
    result[move.from.y][move.from.x] = null;
    result[move.to.y][move.to.x] = state.turn;
    return result;
}

function calculateBoardOnPut(state: GameBoardState, put: PutPieceAction): PointState[][] {
    let result = clone(state.board);
    result[put.position.y][put.position.x] = state.turn;
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

function other(player: PlayerTurn){
    return player === PlayerTurn.ONE ? PlayerTurn.TWO : PlayerTurn.ONE;
}