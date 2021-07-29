import { SetBlockingUIAction, UIActionType } from "./types";

export function setBlockingUI(blocking: boolean, message: string): SetBlockingUIAction {
    return {
        type: UIActionType.SET_BLOCKING,
        blocking: blocking,
        blockingMessage: message
    }
}