import {UserState, UserAction, UserActionType, SetUserNameAction} from './types'

const initialState: UserState= {
    name : getRandomName(),
    isNameSet: false
}

export function userReducer(state: UserState = initialState, action: UserAction): UserState {
    switch(action.type){
        case UserActionType.SET_NAME: {
            let setNameAction = action as SetUserNameAction;
            return {
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
   var result           = 'Guest_';
   var characters       = '0123456789';
   var charactersLength = characters.length;
   for ( var i = 0; i < charactersLength; i++ ) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
   }
   return result;
}