import {combineReducers, createStore} from 'redux';
import { gameBoardReducer } from './gameBoard/reducer';
import {composeWithDevTools} from 'redux-devtools-extension';

const rootReducer = combineReducers({
    game: gameBoardReducer
});

export type ApplicationState = ReturnType<typeof rootReducer>

export const store = createStore(rootReducer, composeWithDevTools());