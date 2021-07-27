import {GameActionType, PutPieceAction, MovePieceAction, Point, SelectPieceAction, ApplyServerStateAction, GameBoardState, GameState} from './types';

export function applyServerState(state: GameState): ApplyServerStateAction {
    return {
        type: GameActionType.APPLY_SERVER_STATE,
        newState: state
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