import 'bootstrap/dist/css/bootstrap.css';
import {combineReducers, createStore} from 'redux';
import { gameReducer } from './gameBoard/reducer';
import { userReducer } from './user/reducer';
import {composeWithDevTools} from 'redux-devtools-extension';
import { blockingUIReducer } from './ui/reducer';

const rootReducer = combineReducers({
    blockingUI: blockingUIReducer,
    game: gameReducer,
    user: userReducer
});

export type ApplicationState = ReturnType<typeof rootReducer>

export const store = createStore(rootReducer, composeWithDevTools());