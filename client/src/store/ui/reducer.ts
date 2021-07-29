import { BlockingUIState, SetBlockingUIAction, UIActionType } from "./types";


const initialState: BlockingUIState = {
    blocking: false,
    blockingMessage: ""
}

export function blockingUIReducer(state: BlockingUIState = initialState, action: SetBlockingUIAction): BlockingUIState {
    switch(action.type){
        case UIActionType.SET_BLOCKING: {
            return {
                blocking: action.blocking,
                blockingMessage: action.blockingMessage
            }
        }
        default: 
            return state;
    }
}