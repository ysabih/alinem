import React from 'react';
import { connect } from 'react-redux';
import { BrowserRouter, Route, Switch} from "react-router-dom";
import { ApplicationState } from '../store';
import AppBar from './AppBar';
import Game from './Game';
import Home from './Home';

interface StateProps {
    showPrefsModal: boolean
}
interface DispatchProps {
}
interface OwnProps {
}
type Props = StateProps & DispatchProps & OwnProps;

function App(props: Props) {
  return (
    <>
    <AppBar />
    <BrowserRouter basename='/'>
        <Switch>
            <Route exact path="/play" component={Game} />
            {/* To join a private game (game vs friend) directy through link*/}
            <Route exact path="/join/:gameId" component={Game}/>
            <Route exact path="/" component={Home} />
        </Switch>
    </BrowserRouter>
    </>
  );
}

function mapState(state: ApplicationState) : StateProps {
    return {
        showPrefsModal: state.blockingUI.showModal
    };
}
const mapDispatch : DispatchProps = {}

export default connect<StateProps, DispatchProps, OwnProps, ApplicationState>(
    mapState,
    mapDispatch
)(App)

