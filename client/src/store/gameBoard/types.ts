export enum GameBoardActionType {
    INIT = "gameBoard/init",
    ADD_PIECE = "gameBoard/addPiece",
    MOVE_PIECE = "gameBoard/MovePiece",
    SELECT_PIECE = "gameBoard/SelectPiece"
}

export interface Point {
    readonly x: number,
    readonly y: number
}
export enum Player {
    ONE = 'PLAYER 1',
    TWO = 'PLAYER 2'
}
export enum GameMode {
    PUT = 'PUT',
    MOVE = 'MOVE'
}
export type PointState = Player | null

export interface GameBoardState {
    turn: Player,
    winner: Player | null,
    turnCount: number,
    board: PointState[][],
    gameMode: GameMode
    selected: Point | null
}

export interface GameBoardAction {
    readonly type: GameBoardActionType
}

export interface PutPieceAction extends GameBoardAction{
    type: GameBoardActionType.ADD_PIECE,
    readonly position: Point
}

export interface SelectPieceAction extends GameBoardAction {
    type: GameBoardActionType.SELECT_PIECE,
    readonly position: Point
}

export interface MovePieceAction extends GameBoardAction{
    type: GameBoardActionType.MOVE_PIECE
    readonly from: Point,
    readonly to: Point
}

