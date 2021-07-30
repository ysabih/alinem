export enum UserActionType {
    SET_NAME = "user/setName",
    SET_ID = "user/setId",
}

export interface UserAction {
    type: UserActionType
}

export interface SetUserNameAction extends UserAction{
    readonly newName: string
}

export interface UserState {
    id: string
    name: string
    isNameSet: boolean
}
