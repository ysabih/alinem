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
export enum PlayerTurn {
    ONE = 0,
    TWO = 1
}
export enum GameMode {
    PUT = 'PUT',
    MOVE = 'MOVE'
}
export enum PlayerType {
    LOCAL_HUMAN,
    REMOTE_HUMAN,
    COMPUTER
}
export type PointState = PlayerTurn | null

export interface GameBoardState {
    playerTypes : PlayerType[]
    turn: PlayerTurn,
    winner: PlayerTurn | null,
    turnCount: number,
    board: PointState[][],
    gameMode: GameMode
    selected: Point | null
}

export enum GameType {
    VS_COMPUTER = "vsComputer"
}

export interface GameBoardAction {
    readonly type: GameBoardActionType
}

export interface InitGameAction extends GameBoardAction {
    type: GameBoardActionType.INIT,
    gameType: GameType
}

export interface PutPieceAction extends GameBoardAction {
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

