export enum UIActionType {
    SET_BLOCKING = "ui/blocking"
}

export interface SetBlockingUIAction {
    type: UIActionType,
    blocking: boolean,
    blockingMessage: string
}

export interface BlockingUIState {
    blocking: boolean,
    blockingMessage: string
}