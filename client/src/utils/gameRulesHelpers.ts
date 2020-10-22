import { GameBoardState, GameMode, MovePieceAction, Player, Point, PointState, PutPieceAction } from "../store/gameBoard/types";

export function checkValidPut(gameState: GameBoardState, put: PutPieceAction): void {

}

export function checkValidMove(gameState: GameBoardState, move: MovePieceAction): void {
    
}

export function isWinner(board: PointState[][], currentPlayer: Player): boolean{
    if(board.length > 3){
        throw new Error(`Calculating winner on ${board.length}-piece board not implemented`);
    }
    let positions: Point[] = getPlayerPositions(board, currentPlayer);
    if(positions.length < 3) return false;
    if(areCollinear(positions[0], positions[1], positions[2])){
        return true;
    }
    return false;
}

function getPlayerPositions(board: PointState[][], player: Player): Point[]{
    let result = new Array<Point>();
    for(let i=0; i<board.length; i++){
        for(let k=0; k<board[0].length; k++){
            if(board[i][k] === player){
                result.push({x: k, y: i});
            }
        }
    }

    return result;
}

function areCollinear(p1: Point, p2: Point, p3: Point){
    let left:number = (p2.y - p1.y) * (p3.x - p2.x);
    let right:number = (p3.y - p2.y) * (p2.x - p1.x);
    return left === right;
}

export function isPlayable(gameState: GameBoardState, position: Point): boolean{
    let result = false;
    if(gameState.winner != null) return false;

    switch(gameState.gameMode){
        case GameMode.PUT: {
            result = getPositionState(gameState.board, position) == null;
            break;
        }
        case GameMode.MOVE: {
            let positionState: PointState = getPositionState(gameState.board, position);
            if( positionState === gameState.turn){
                return true;
            }
            let selected: Point|null = gameState.selected;
            return selected != null && positionState == null && areAdjacent(selected, position);
        }
    }

    return result;
}

export function areEqual(first: Point, second: Point){
    return first.x === second.x && first.y === second.y;
}

function areAdjacent(first: Point, second: Point): boolean {
    let distX = Math.abs(first.x - second.x);
    if(distX > 1) return false;
    let distY = Math.abs(first.y - second.y);
    if(distY > 1) return false;
    return distX + distY <= 2
}

export function getPositionState(board: PointState[][], position: Point): PointState {
    return board[position.y][position.x];
}