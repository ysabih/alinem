import { BlockingUIState, SetBlockingUIAction, setShowPrefsModalAction, UIAction, UIActionType } from "./types";


const initialState: BlockingUIState = {
    blocking: false,
    blockingMessage: "",
    showModal: false
}

export function blockingUIReducer(state: BlockingUIState = initialState, action: UIAction): BlockingUIState {
    switch(action.type){
        case UIActionType.SET_BLOCKING: {
            let setBlockingAction = action as SetBlockingUIAction;
            if(state.showModal) {
                throw new Error("Can't block UI while showing references modal");
            }
            return {
                ...state,
                blocking: setBlockingAction.blocking,
                blockingMessage: setBlockingAction.blockingMessage
            }
        }
        case UIActionType.SET_SHOW_PREFS_MODAL: {
            let setShowPrefsModal = action as setShowPrefsModalAction;
            if(state.blocking) {
                throw new Error("Can't show preferences modal while UI is blocking");
            }
            return {
                ...state,
                showModal: setShowPrefsModal.showModal
            }
        }
        default: 
            return state;
    }
}