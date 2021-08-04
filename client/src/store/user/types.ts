export enum UserActionType {
    SET_NAME = "user/setName"
}

export interface UserAction {
    type: UserActionType
}

export interface SetUserNameAction extends UserAction{
    readonly newName: string
}

export interface UserState {
    name: string
    isNameSet: boolean
}
