export enum GameActionType {
    APPLY_SERVER_STATE = "game/applyServerState",
    ADD_PIECE = "gameBoard/addPiece",
    MOVE_PIECE = "gameBoard/MovePiece",
    SELECT_PIECE = "gameBoard/SelectPiece"
}

export interface Point {
    readonly x: number,
    readonly y: number
}
export enum PlayerTurn {
    ONE = "ONE",
    TWO = "TWO"
}
export enum GameMode {
    PUT = 'PUT',
    MOVE = 'MOVE'
}
export enum PlayerType {
    HUMAN,
    COMPUTER
}
export type PointState = PlayerTurn | null

export interface GameState {
    id: string | null,
    startTimtUtc: Date | null,
    player1: Player | null,
    player2: Player | null,
    boardState: GameBoardState
    userConnectionsState: UserConnectionState[]
}

export interface GameBoardState {
    currentTurn: PlayerTurn | null,
    winner: PlayerTurn | null,
    turnNumber: number,
    board: PointState[][],
    gameMode: GameMode
    selected: Point | null
}

export interface Player {
    id: string,
    name: string,
    type: PlayerType
}

export enum UserConnectionState {
    CONNECTED = "CONNECTED",
	NOT_CONNECTED = "NOT_CONNECTED",
	ABORTED = "ABORTED"
}

export enum GameType {
    VS_COMPUTER = "VS_COMPUTER"
}

export interface GameAction {
    readonly type: GameActionType
}

// Used to update state following notification from server
export interface ApplyServerStateAction extends GameAction {
    type: GameActionType.APPLY_SERVER_STATE,
    readonly newState: GameState
}

export interface PutPieceAction extends GameAction {
    type: GameActionType.ADD_PIECE,
    readonly position: Point
}

export interface SelectPieceAction extends GameAction {
    type: GameActionType.SELECT_PIECE,
    readonly position: Point
}

export interface MovePieceAction extends GameAction{
    type: GameActionType.MOVE_PIECE
    readonly from: Point,
    readonly to: Point
}

