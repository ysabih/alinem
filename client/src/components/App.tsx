import React from 'react';
import AppBar from './AppBar';
import GameBoard from './GameBoard';

function App() {
  return (
    <>
        <AppBar />
        <div style={{marginTop: '70px', marginLeft: '12px', marginRight: '12px'}}>
            <GameBoard />
        </div>
    </>
  );
}

export default App;
