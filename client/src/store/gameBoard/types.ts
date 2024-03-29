export enum GameActionType {
    APPLY_GAME_STATE = "game/applyGameState",
    APPLY_BAORD_STATE = "game/applyBoardState",
    RESET_GAME_STATE = "game/resetGameState",
    SET_OPPONENT_QUIT = "game/setOpponentQuit",
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
    HUMAN = "HUMAN",
    COMPUTER = "COMPUTER"
}
export type PointState = PlayerTurn | null

export interface GameState {
    id: string,
    type: GameType,
    startTimtUtc: Date,
    stage: GameStage,
    // Is null when still waiting for opponent
    player2: Player | null, 
    player1: Player,
    // Is null when not playing yet (e.g. when waiting for opponent)
    boardState: GameBoardState | null, 
     // Actually used only in games vs computer, configured a user preference and sent to server at game initialization
    difficulty: GameDifficulty,
}

export interface GameBoardState {
    currentTurn: PlayerTurn | null,
    winner: PlayerTurn | null,
    turnNumber: number,
    board: PointState[][],
    gameMode: GameMode
    selected: Point | null
}

export interface GameNotification {
    lastAction: GameAction | null,
    newGameState: GameState
}

export interface Player {
    id: string,
    name: string,
    type: PlayerType
}

export enum GameType {
    VS_COMPUTER = "VS_COMPUTER",
    VS_RANDOM_PLAYER = "VS_RANDOM_PLAYER",
    VS_FRIEND = "VS_FRIEND"
}

export enum GameStage {
    UNINITIALIZED = "UNINITIALIZED", /*To be used by client only*/
    WAITING_FOR_OPPONENT = "WAITING_FOR_OPPONENT",
	PLAYING = "PLAYING",
	GAME_OVER = "GAME_OVER",
    OPPONENT_LEFT = "OPPONENT_LEFT",
}

export enum GameDifficulty {
    EASY = "EASY",
    MEDIUM = "MEDIUM",
    HARD = "HARD"
}

export interface GameAction {
    readonly type: GameActionType
}

// Used to update state following game initialization on server
export interface ApplyGameStateAction extends GameAction {
    type: GameActionType.APPLY_GAME_STATE,
    readonly newState: GameState
}

export interface ResetGameStateAction extends GameAction {
    type: GameActionType.RESET_GAME_STATE
}

export interface SetOpponentQuitStateAction extends GameAction {
    type: GameActionType.SET_OPPONENT_QUIT
}

export interface ApplyBoardStateAction extends GameAction {
    type: GameActionType.APPLY_BAORD_STATE,
    readonly newBoardState: GameBoardState
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

