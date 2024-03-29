import { GameDifficulty, GameState, GameType, PlayerTurn, Point } from "../store/gameBoard/types";

export interface InitGameRequest {
    userName: string,
    userTurn: PlayerTurn,
    gameType: GameType
    difficulty: GameDifficulty | null,
}

export interface JoinGameResponse {
    state: JoinGameResponseType,
    gameState: GameState
}

export enum JoinGameResponseType {
    SUCCESS = "SUCCESS",
	GAME_NOT_FOUND = "GAME_NOT_FOUND",
    CONNECTION_TO_SERVER_FAILED = "FAILED_TO_CONNECT_TO_SERVER"
}

export enum ServerConnectionState {
    CONNECTED = 0,
    RECONNCTED = 1,
    RECONNECTING = 2,
    CLOSED = 3,
    UNINITIALIZED = 4
}

export interface JoinPrivateGameRequest {
    gameId: string,
    userName: string
}

export interface ResetGameRequest {
    gameId: string,
    userTurn: PlayerTurn
}

export interface QuitGameRequest {
    gameId: string
}

export interface GameActionRequest {
    gameId: string,
    action: GameAction,
}

export interface GameAction {}

export interface MovePieceAction extends GameAction {
    from: Point,
    to: Point
}

export interface PutPieceAction extends GameAction {
    position: Point
}

export interface SignalrConnectionError {
    innerError: any
}

export interface SignalrNotConnectedError {
    message: string
}