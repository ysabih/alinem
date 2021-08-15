import React from 'react';
import { BrowserRouter, Route, Switch} from "react-router-dom";
import Game from './Game';
import Public from './Public';


function App() {
  return (
    <BrowserRouter basename='/'>
        <Switch>
            <Route exact path="/play" component={Game} />
            {/* To join a private game (game vs friend) directy through link*/}
            <Route exact path="/join/:gameId" component={Game}/>
            <Route exact path="/" component={Public} />
        </Switch>
    </BrowserRouter>
  );
}

export default App;
