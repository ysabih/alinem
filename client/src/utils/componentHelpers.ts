import { GameBoardState } from "../store/gameBoard/types";
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