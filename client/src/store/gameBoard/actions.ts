import {GameBoardActionType, PutPieceAction, MovePieceAction, Point, GameBoardAction, SelectPieceAction} from './types';

export function initGame() : GameBoardAction {
    return {
        type: GameBoardActionType.INIT
    }
}

export function addPiece(position: Point): PutPieceAction {
    return {
        type: GameBoardActionType.ADD_PIECE,
        position: position
    }
}

export function movePiece(from: Point, to: Point): MovePieceAction {
    return {
        type: GameBoardActionType.MOVE_PIECE,
        from: from,
        to: to
    }
}

export function selectPiece(position: Point): SelectPieceAction {
    return {
        type: GameBoardActionType.SELECT_PIECE,
        position: position
    }
}