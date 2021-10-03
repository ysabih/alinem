import { UserPreferences } from './types';

export enum UserActionType {
    SET_PREFERENCES = "user/setPreferences"
}

export interface UserAction {
    type: UserActionType,
}

export interface SetPreferencesAction extends UserAction{
    type: UserActionType.SET_PREFERENCES,
    newPrefs: UserPreferences
}

export function setUserPreferences(newPrefs: UserPreferences): SetPreferencesAction {
    return {
        type: UserActionType.SET_PREFERENCES,
        newPrefs: newPrefs
    }
}