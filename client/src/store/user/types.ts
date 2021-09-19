import { GameDifficulty } from "../gameBoard/types";

export interface UserState {
    preferencesSet: boolean,
    userPreferences: UserPreferences
}

export interface UserPreferences {
    userName: string,
    gameDifficulty: GameDifficulty,
    showPrefsModalBeforeGame: boolean
}