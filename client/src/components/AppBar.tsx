import React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCog } from '@fortawesome/free-solid-svg-icons';
import { ApplicationState } from '../store';
import { connect } from 'react-redux';
import { UserPreferences } from '../store/user/types';
import { GameDifficulty } from '../store/gameBoard/types';
import { setUserPreferences } from '../store/user/actions';

interface StateProps {
    userPrefs: UserPreferences
}
interface DispatchProps {
    setUserPreferences: typeof setUserPreferences
}
interface OwnProps {
}
type Props = StateProps & DispatchProps & OwnProps;

function AppBar(props: Props) {

    let [tempUserName, setTempUserName] = useState(props.userPrefs.userName);
    let [tempGameDifficulty, setTempGameDifficulty] = useState(props.userPrefs.gameDifficulty);

    function prefsChanged(): boolean {
        return props.userPrefs.userName !== tempUserName 
               || props.userPrefs.gameDifficulty !== tempGameDifficulty;
    }

    function savePrefs(): void {
        props.setUserPreferences({
            userName: tempUserName,
            gameDifficulty: tempGameDifficulty,
            showPrefsModalBeforeGame: false /*Not used for now*/ 
        });
    }

    return (
    <>
    <nav className="navbar bg-light navbar-expand-lg fixed-top shadow-box shadow-sm d-flex" style={{height: '60px'}}>
        <div className="navbar-brand">
            <span className="h3">Alinem</span>
        </div>

        <div className="flex-grow-1 d-flex flex-row justify-content-end align-items-center">
            <span style={{fontWeight: 'bold'}} className="mr-2" >{props.userPrefs.userName}</span>
            <button id="openPrefs" type="button" className="btn btn-link" data-toggle="modal" data-target="#prefsModal">
                <FontAwesomeIcon icon={faCog} />
            </button>
        </div>
    </nav>
    {/* Prefs modal */}
    <div className="modal fade" id="prefsModal" tabIndex={-1} role="dialog" aria-labelledby="prefsModalLabel" aria-hidden="true">
        <div className="modal-dialog" role="document">
            <div className="modal-content">
                <div className="modal-header">
                    <h5 className="modal-title" id="prefsModalLabel">Preferences</h5>
                    <button type="button" className="close" data-dismiss="modal" aria-label="Close">
                        <span aria-hidden="true">&times;</span>
                    </button>
                </div>
                <div className="modal-body">
                    <form>
                        <div className="form-group">
                            <label htmlFor="nickNameInput">Nickname</label>
                            <input type="email" className="form-control" id="nickNameInput" placeholder="AlinemGenius13" 
                                value={tempUserName} 
                                onChange={(event) => setTempUserName(event.target.value)} />
                        </div>
                        <div className="form-group">
                            <label htmlFor="difficultyPicker">Difficulty (applies to games vs computer)</label>
                            <select className="form-control" id="difficultyPicker" 
                                onChange={ (event) => setTempGameDifficulty(toGameDifficulty(event.target.value)) } >
                                {Object.keys(GameDifficulty).map(key => 
                                <option selected={key === tempGameDifficulty}>{key}</option>)}
                            </select>
                        </div>
                    </form>
                </div>
                <div className="modal-footer">
                    <button type="button" className="btn btn-secondary" data-dismiss="modal">Cancel</button>
                    <button type="button" className="btn btn-primary" data-dismiss="modal" disabled={!prefsChanged()} onClick={savePrefs}>Save</button>
                </div>
            </div>
        </div>
    </div>
    </>
    );
}

function toGameDifficulty(str: string): GameDifficulty {
    const upperCase: string = str.toUpperCase();
    switch(upperCase) {
        case "EASY": return GameDifficulty.EASY;
        case "MEDIUM": return GameDifficulty.MEDIUM;
        case "HARD": return GameDifficulty.HARD;
        default: throw new Error("Invalid game difficulty: "+str);
    }
}

function mapState(state: ApplicationState) : StateProps {
    return {
        userPrefs: state.user.userPreferences
    };
}
const mapDispatch : DispatchProps = {
    setUserPreferences: setUserPreferences
}

export default connect<StateProps, DispatchProps, OwnProps, ApplicationState>(
    mapState,
    mapDispatch
)(AppBar)
