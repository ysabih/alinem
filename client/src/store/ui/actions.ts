import { SetBlockingUIAction, setShowPrefsModalAction, UIActionType } from "./types";

export function setBlockingUI(blocking: boolean, message: string): SetBlockingUIAction {
    return {
        type: UIActionType.SET_BLOCKING,
        blocking: blocking,
        blockingMessage: message
    }
}

export function setShowPrefsModal(showModal: boolean): setShowPrefsModalAction {
    return {
        type: UIActionType.SET_SHOW_PREFS_MODAL,
        showModal: showModal
    }
}