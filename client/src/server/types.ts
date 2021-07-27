import { GameType, PlayerTurn, Point } from "../store/gameBoard/types";

export interface InitGameRequest {
    requesterPlayerName: string,
    requesterTurn: PlayerTurn,
    gameType: GameType
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