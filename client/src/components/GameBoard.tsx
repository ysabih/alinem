import React, { useEffect, useState } from 'react';
import { connect } from 'react-redux';
import { GameBoardState, GameStage, GameState, GameType, PlayerTurn, PlayerType, PointState} from '../store/gameBoard/types';
import { ApplicationState} from '../store/index'
import GamePosition from './GamePosition';
import { UserState } from '../store/user/types';
import { backendService } from '../server/backendService'
import LoadingSpinner from './LoadingSpinner';
import { InitGameRequest, QuitGameRequest, ResetGameRequest } from '../server/types';
import { applyGameBoardState, applyGameState, resetGameState, setOpponentLeftState } from '../store/gameBoard/actions';
import { BlockingUIState } from '../store/ui/types';
import { setBlockingUI } from '../store/ui/actions';
import { runBlockingAsync } from '../utils/componentHelpers';
import { Link } from 'react-router-dom';
import { getCurrentPlayerId } from '../utils/gameRulesHelpers';

interface StateProps {
    blockingUI: BlockingUIState,
    game: GameState
    user: UserState
}
interface DispatchProps {
    applyGameState: typeof applyGameState,
    resetGameState: typeof resetGameState,
    applyGameBoardState: typeof applyGameBoardState,
    setBlockingUI: typeof setBlockingUI,
    setOpponentLeftState: typeof setOpponentLeftState
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
            userName: props.user.name,
            // TODO: Make this configurable
            userTurn: PlayerTurn.ONE
        }
        let gameState = await backendService.initGameAsync(initRequest);
        if(!gameState) {
            throw new Error("New board state cannot be falsy, value: " + gameState);
        }
        console.debug("Initialized game on server, booard state: ", gameState);
        backendService.registerGameStateUpdateHandler((newState: GameState) => {
            props.applyGameState(newState);
        })
        backendService.registerOpponentLeftNotificationHandler(() => {
            console.debug("Received notification: Opponent left the game")
            props.setOpponentLeftState();
        });

        props.applyGameState(gameState);
        setInitialized(true);
    }

    return (
        <>
            { props.blockingUI.blocking ? <LoadingSpinner message={props.blockingUI.blockingMessage} /> : <></> }
            <div style={{opacity: props.blockingUI.blocking? 0.2 : 1}}>
                <GameBoardCore {...props}/>
                <div className='container' style={{marginTop: 24}}>
                    <div className='row justify-content-center'>
                        <button className='col col-auto btn btn-lg btn-primary mr-3' 
                        style={{display: canResetGame(props) ? 'inline' : 'none'}} 
                        onClick={() => resetCurrentGame(props)}>RESET</button>

                        <Link className='col col-auto btn btn-lg btn-primary' to='' 
                        style={{display: canQuitGame(props) ? 'inline' : 'none'}} 
                        onClick={() => quitCurrentGame(props)}>EXIT</Link>
                    </div>
                </div>
            </div>
        </>
    );
}

function quitCurrentGame(props: Props) {
    runBlockingAsync(async () => {
        await quitGameOnServerAsync(props);
        props.resetGameState();
        backendService.clearGameStateUpdateHandler();
    }, "Quitting game...", props.setBlockingUI);
}

const quitableGameStages: GameStage[] = [
    GameStage.WAITING_FOR_OPPONENT,
    GameStage.GAME_OVER,
    GameStage.PLAYING
];

function quitGameOnServerAsync(props:Props) {
    let quitable: boolean = (quitableGameStages.find(e => props.game.stage === e)) !== undefined;
    if(quitable) {
        let request: QuitGameRequest = {
            gameId: props.game.id
        };
        return backendService.quitGameAsync(request);
    }
    else{
        console.debug("No need to send quitGame request, game stage is "+props.game.stage);
    }
}

function resetCurrentGame(props: Props) {
    runBlockingAsync(async () => {
        let request: ResetGameRequest = {
            gameId: props.game.id,
            userTurn: PlayerTurn.ONE
        }
        let newBoardState = await backendService.resetGameAsync(request);
        props.applyGameBoardState(newBoardState);
    }, "Resetting game...", props.setBlockingUI);
}

function canResetGame(props: Props): boolean {
    // Only games vs computer and finished games can be reset
    if(props.game.type !== GameType.VS_COMPUTER) return false;
    if(props.game.stage !== GameStage.PLAYING) return false;
    if(props.game.boardState == null) {
        throw new Error("Board state must not be null while game stage is "+props.game.stage);
    }
    if(props.game.player2 == null) {
        throw new Error("player2 must not be null while game stage is "+props.game.stage);
    }
    let vsComputer:boolean = props.game.player1.type === PlayerType.COMPUTER || props.game.player2.type === PlayerType.COMPUTER;
    let connected = backendService.isConnected();
    let firstTurn = props.game.boardState.turnNumber <= 1;
    return (vsComputer || props.game.boardState.winner != null) && connected && !firstTurn;
}

function canQuitGame(props: Props): boolean {
    return props.game.stage !== GameStage.UNINITIALIZED
}

function GameBoardCore(props: Props) {
    switch(props.game.stage) {
        case GameStage.UNINITIALIZED: {
            return (<></>);
        }
        case GameStage.PLAYING: 
        case GameStage.GAME_OVER: 
        {
            let userId = backendService.getUserId();
            let currentPlayerId = getCurrentPlayerId(props.game);
            let boardPlayable: boolean = userId === currentPlayerId;
            if(props.game.boardState == null) {
                throw new Error("Board state must not be null while game stage is "+props.game.stage);
            }
            return (
                <>
                <GameHUD {...props} />
                <Board board={props.game.boardState.board} playable={boardPlayable} />
                </>
            );
        }
        case GameStage.WAITING_FOR_OPPONENT: {
            return (
                <h3>Waiting for a player to join the game</h3>
            );
        }
        case GameStage.OPPONENT_LEFT: {
            return (
                <h3>Oops, Opponent left</h3>
            );
        }
        default: {
            throw new Error("Unsupported game stage: "+props.game.stage);
        }
    }
}

function GameHUD(props: StateProps){
    let playerNames = getPlayerDisplayNames(props);
    let boardState: GameBoardState | null = props.game.boardState;
    if(boardState == null) {
        throw new Error("Board state must not be null while game stage is "+props.game.stage);
    }
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

function Board(props: {board: PointState[][], playable: boolean}) {
    let boardState = props.board;
    let rows = new Array(boardState.length);
    for(let i = 0; i<boardState.length; i++){
        rows[i] = Row(i, boardState[i].length, props.playable);
    }
    return (
        <div className='container'>
            {rows}
        </div>
    );
}

function Row(rowIndex: number, rowLength: number, playable: boolean) {
    let row = new Array(rowLength);
    for(let i = 0; i < row.length; i++){
        row[i] = <GamePosition 
                    position={{x: i, y: rowIndex}}
                    key={`${i}${rowIndex}`} playable={playable} />
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
    applyGameState: applyGameState,
    resetGameState: resetGameState,
    applyGameBoardState: applyGameBoardState,
    setOpponentLeftState: setOpponentLeftState,
    setBlockingUI: setBlockingUI
}
export default connect<StateProps, DispatchProps, OwnProps, ApplicationState>(
    mapState,
    mapDispatch
)(GameBoard)


