import React, { useEffect, useState } from 'react';
import { connect } from 'react-redux';
import { GameBoardState, GameState, GameType, PlayerTurn, PointState} from '../store/gameBoard/types';
import { ApplicationState} from '../store/index'
import GamePosition from './GamePosition';
import { UserState } from '../store/user/types';
import { backendService } from '../server/backendService'
import LoadingSpinner from './LoadingSpinner';
import { InitGameRequest } from '../server/types';
import { appyGameState } from '../store/gameBoard/actions';
import { BlockingUIState } from '../store/ui/types';
import { setBlockingUI } from '../store/ui/actions';
import { runBlockingAsync } from '../utils/componentHelpers';

interface StateProps {
    blockingUI: BlockingUIState,
    game: GameState
    user: UserState
}
interface DispatchProps {
    applyServerState: typeof appyGameState,
    setBlockingUI: typeof setBlockingUI
}
interface OwnProps {
    gameType: GameType
}
type Props = StateProps & DispatchProps & OwnProps;

function GameBoard(props: Props) {
    const [initialized, setInitialized] = useState(false);

    // Init game on server
    useEffect(() => {
        runBlockingAsync(initializeAsync, "Initializing new game...", props.setBlockingUI);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    async function initializeAsync() {
        if(initialized){
           return 
        }
        
        await backendService.connectAsync();
        // initiate game on server first
        let initRequest: InitGameRequest = {
            gameType: props.gameType,
            user: {
                id: props.user.id,
                name: props.user.name
            },
            // TODO: Make this configurable
            userTurn: PlayerTurn.ONE
        }
        let gameState = await backendService.initGameAsync(initRequest);
        if(!gameState) {
            throw new Error("New board state cannot be falsy, value: " + gameState);
        }
        console.debug("Initialized game on server, booard state: ", gameState);

        props.applyServerState(gameState);

        setInitialized(true);
    }

    return (
        <>
            { props.blockingUI.blocking ? <LoadingSpinner message={props.blockingUI.blockingMessage} /> : <></> }
            <div style={{opacity: props.blockingUI.blocking? 0.2 : 1}}>
                <GameHUD {...props} />
                <Board board={props.game.boardState.board} />
                <div className='container' style={{marginTop: 24}}>
                    <div className='row justify-content-center'>
                        <button className='btn btn-lg btn-primary'>RESET</button>
                    </div>
                </div>
            </div>
        </>
    );
}

function GameHUD(props: StateProps){
    let playerNames = getPlayerDisplayNames(props);
    let boardState: GameBoardState = props.game.boardState;
    if(boardState.winner != null){
        let winnerName = boardState.winner === PlayerTurn.ONE ? playerNames[0] : playerNames[1];
        return(
            <h3 className='h2' style={{textAlign: 'center', marginBottom: '32px'}}>{winnerName} WINS!</h3>
        );
    }
    let playerTurn = boardState.currentTurn;
    let playerCursorStyle = "2px solid";
    let playerOneBorder = playerTurn === PlayerTurn.ONE ? playerCursorStyle : "";
    let playerTwoBorder = playerTurn === PlayerTurn.TWO ? playerCursorStyle : "";
    return(
    <div className="container mb-5 mt-4 h-100">
    <div className="row flex-nowrap h-100 justify-content-center">
        <div className="col-sm-5 text-left p-2" style={{border: playerOneBorder, borderRadius: 8}}><span className="h4" style={{color: "red"}}>{playerNames[0]}</span></div>
        {/* <div className="col-sm text-center h4">{turnCount}</div> */}
        <div className="col-sm-5 text-right p-2" style={{border: playerTwoBorder, borderRadius: 8}}><span className="h4" style={{color: "blue"}}>{playerNames[1]}</span></div>
    </div>
    </div>
    );
}

function getPlayerDisplayNames(props: StateProps) : (string|undefined)[] {
    return  [
        props.game.player1?.name,
        props.game.player2?.name
    ];
}

function Board(props: {board: PointState[][]}) {
    let boardState = props.board;
    let rows = new Array(boardState.length);
    for(let i = 0; i<boardState.length; i++){
        rows[i] = Row(i, boardState[i].length);
    }
    return (
        <div className='container'>
            {rows}
        </div>
    );
}

function Row(rowIndex: number, rowLength: number) {
    let row = new Array(rowLength);
    for(let i = 0; i < row.length; i++){
        row[i] = <GamePosition 
                    position={{x: i, y: rowIndex}}
                    key={`${i}${rowIndex}`} />
    }

    return (
        <div className="row flex-nowrap justify-content-center" key={rowIndex}>
            {row}
        </div>
    );
}

function mapState(state: ApplicationState) : StateProps {
    return {
        blockingUI: state.blockingUI,
        game: state.game,
        user: state.user
    };
}
const mapDispatch : DispatchProps = {
    applyServerState: appyGameState,
    setBlockingUI: setBlockingUI
}
export default connect<StateProps, DispatchProps, OwnProps, ApplicationState>(
    mapState,
    mapDispatch
)(GameBoard)


