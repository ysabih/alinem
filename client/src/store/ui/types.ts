export enum UIActionType {
    SET_BLOCKING = "ui/blocking",
    SET_SHOW_PREFS_MODAL = "ui/showPrefsModal"
}

export interface UIAction {
    type: UIActionType
}

export interface SetBlockingUIAction extends UIAction{
    blocking: boolean,
    blockingMessage: string
}

export interface setShowPrefsModalAction extends UIAction{
    showModal: boolean
}

export interface BlockingUIState {
    blocking: boolean,
    blockingMessage: string,
    showModal: boolean
}