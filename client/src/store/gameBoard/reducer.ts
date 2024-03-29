import { isWinner, checkValidMove, checkValidPut, getPositionState } from '../../utils/gameRulesHelpers';
import {PutPieceAction, GameAction, GameActionType, 
        GameBoardState, GameMode, MovePieceAction, PlayerTurn, PointState, SelectPieceAction, ApplyGameStateAction, GameState, PlayerType, ApplyBoardStateAction, GameStage, GameType, GameDifficulty} from './types';

const BOARD_ROW_LENGTH = 3;
const unintializedState: GameState = {
    id: "",
    type: GameType.VS_COMPUTER,
    startTimtUtc: new Date(0),
    stage: GameStage.UNINITIALIZED,
    player1: {
        id: "",
        name: "",
        type: PlayerType.COMPUTER
    },
    player2: null,
    boardState: null,
    difficulty: GameDifficulty.EASY, // Arbitrary
}

export function gameReducer(state: GameState = unintializedState, action: GameAction): GameState {
    switch(action.type){
        case GameActionType.ADD_PIECE : {
            if(state.boardState == null) {
                throw new Error("Board state must not be null to apply game move");
            }
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
            return {
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
            if(state.boardState == null) {
                throw new Error("Board state must not be null to apply game move");
            }
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
            if(state.boardState == null) {
                throw new Error("Board state must not be null to apply game move");
            }
            let positionState = getPositionState(state.boardState.board, selectAction.position);
            if(positionState == null){
                throw new Error(`Cannot select an empty position (${selectAction.position.x}, ${selectAction.position.y})`);
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

        case GameActionType.APPLY_BAORD_STATE: {
            let updateAction = action as ApplyBoardStateAction;
            return {
                ...state,
                boardState: updateAction.newBoardState
            }
        }

        case GameActionType.APPLY_GAME_STATE : {
            let updateAction = action as ApplyGameStateAction;
            return updateAction.newState;
        }

        case GameActionType.RESET_GAME_STATE: {
            return unintializedState
        }

        case GameActionType.SET_OPPONENT_QUIT: {
            let newState: GameState = Object.assign({}, unintializedState);
            newState.stage = GameStage.OPPONENT_LEFT;
            newState.type = state.type;
            return newState;
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