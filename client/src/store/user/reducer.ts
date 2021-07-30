import {UserState, UserAction, UserActionType, SetUserNameAction} from './types'
import { v4 as uuidv4 } from 'uuid';

const initialState: UserState= {
    id: uuidv4(),
    name : getRandomName(),
    isNameSet: false
}

export function userReducer(state: UserState = initialState, action: UserAction): UserState {
    switch(action.type){
        case UserActionType.SET_NAME: {
            let setNameAction = action as SetUserNameAction;
            return {
                ...state,
                name: setNameAction.newName,
                isNameSet: true
            }
        }
        default: {
            return state;
        }
    }
}

function getRandomName() : string {
   let id: string = uuidv4();
   return 'Guest_'+id.substring(0,6);
}