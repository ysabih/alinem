import { UserActionType, SetUserNameAction } from './types';

export function setName(newName: string) : SetUserNameAction {
    return {
        type: UserActionType.SET_NAME,
        newName: newName
    }
}
