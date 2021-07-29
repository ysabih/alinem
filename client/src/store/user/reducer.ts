import {UserState, UserAction, UserActionType, SetUserNameAction, SetUserIdAction} from './types'

const userName: string = getRandomName();
const initialState: UserState= {
    id: userName,
    name : userName,
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
        case UserActionType.SET_ID: {
            let setIdAction = action as SetUserIdAction;
            return {
                ...state,
                id: setIdAction.id
            }
        }
        default: {
            return state;
        }
    }
}

function getRandomName() : string {
   var result           = 'Guest_';
   var characters       = '0123456789';
   var charactersLength = 12;
   for ( var i = 0; i < charactersLength; i++ ) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
   }
   return result;
}