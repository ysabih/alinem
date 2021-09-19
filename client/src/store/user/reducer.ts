import {UserState, UserPreferences} from './types'
import { v4 as uuidv4 } from 'uuid';
import { GameDifficulty } from '../gameBoard/types';
import { SetPreferencesAction, UserAction, UserActionType } from './actions';

export const defaultUserPrefs: UserState = {
    preferencesSet: false,
    userPreferences: {
        userName : getRandomName(),
        gameDifficulty: GameDifficulty.HARD,
        showPrefsModalBeforeGame: true
    }
}

export function userReducer(state: UserState = defaultUserPrefs, action: UserAction): UserState {
    switch(action.type){
        case UserActionType.SET_PREFERENCES: {
            let setPrefsAction = action as SetPreferencesAction;
            return {
                preferencesSet: true,
                userPreferences: clone(setPrefsAction.newPrefs)
            }
        }
        default: {
            return state;
        }
    }
}

function clone(userPreferences: UserPreferences): UserPreferences{
    return {
        userName: userPreferences.userName,
        gameDifficulty: userPreferences.gameDifficulty,
        showPrefsModalBeforeGame: userPreferences.showPrefsModalBeforeGame
    }
}

function getRandomName() : string {
   let id: string = uuidv4();
   return 'Guest_'+id.substring(0,6);
}