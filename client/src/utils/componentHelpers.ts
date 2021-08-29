import { applyGameState, selectPiece } from "../store/gameBoard/actions";
import { GameAction, GameBoardState, GameNotification, MovePieceAction } from "../store/gameBoard/types";
import { setBlockingUI } from "../store/ui/actions";

export function runBlockingAsync(func: () => Promise<void>, message: string, stateUpdateFunc: typeof setBlockingUI) {
    stateUpdateFunc(true, message);
    func().then(() => {
        stateUpdateFunc(false, "")
    });
}

export function areEquivalent(s1: GameBoardState, s2: GameBoardState): boolean {
    return JSON.stringify(s1) === JSON.stringify(s2);
}

export function handleGameActionNotification(notification: GameNotification, selectPieceFunc: typeof selectPiece, applyGameStateFunc: typeof applyGameState) {
    const action: GameAction | null = notification.lastAction;
        let visualizableAction = false;
        if(action) {
            let movePiece = action as MovePieceAction;
            if(movePiece && movePiece.from && movePiece.to){
                visualizableAction = true;
                selectPieceFunc(movePiece.from);
            }
        }
        let stateApplicationDelay = visualizableAction ? 750 : 250;
        setTimeout(() => {
            applyGameStateFunc(notification.newGameState); //TODO: handle cae where component is unmounted
        }, stateApplicationDelay);
}