import { GameType, PlayerTurn, Point } from "../store/gameBoard/types";

export interface InitGameRequest {
    user: User,
    userTurn: PlayerTurn,
    gameType: GameType
}

export interface ResetGameRequest {
    gameId: string,
    userId: string,
    userTurn: PlayerTurn
}

export interface User {
    id: string,
    name: string
}

export interface GameActionRequest {
    gameId: string,
    userId: string,
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