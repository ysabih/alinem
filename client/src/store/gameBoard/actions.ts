import {GameActionType, PutPieceAction, MovePieceAction, Point, SelectPieceAction, ApplyGameStateAction, GameState, GameBoardState, ApplyBoardStateAction, ResetGameStateAction} from './types';

export function applyGameState(state: GameState): ApplyGameStateAction {
    return {
        type: GameActionType.APPLY_GAME_STATE,
        newState: state
    }
}

export function resetGameState(): ResetGameStateAction {
    return {
        type: GameActionType.RESET_GAME_STATE
    }
}

export function applyGameBoardState(state: GameBoardState): ApplyBoardStateAction {
    return {
        type: GameActionType.APPLY_BAORD_STATE,
        newBoardState: state
    }
}

export function addPiece(position: Point): PutPieceAction {
    return {
        type: GameActionType.ADD_PIECE,
        position: position
    }
}

export function movePiece(from: Point, to: Point): MovePieceAction {
    return {
        type: GameActionType.MOVE_PIECE,
        from: from,
        to: to
    }
}

export function selectPiece(position: Point): SelectPieceAction {
    return {
        type: GameActionType.SELECT_PIECE,
        position: position
    }
}