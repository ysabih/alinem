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
	GAME_NOT_FOUND = "GAME_NOT_FOUND"
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