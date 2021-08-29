import React, { useEffect, useState } from 'react';
import { connect } from 'react-redux';
import { GameBoardState, GameNotification, GameStage, GameState, GameType, MovePieceAction, PlayerTurn, PointState} from '../store/gameBoard/types';
import { ApplicationState} from '../store/index'
import GamePosition from './GamePosition';
import { UserState } from '../store/user/types';
import { backendService } from '../server/backendService'
import LoadingSpinner from './LoadingSpinner';
import { GameAction, InitGameRequest, JoinPrivateGameRequest, QuitGameRequest, ResetGameRequest } from '../server/types';
import { applyGameBoardState, applyGameState, resetGameState, selectPiece, setOpponentLeftState } from '../store/gameBoard/actions';
import { BlockingUIState } from '../store/ui/types';
import { setBlockingUI } from '../store/ui/actions';
import { runBlockingAsync } from '../utils/componentHelpers';
import { Link } from 'react-router-dom';
import { getCurrentPlayerId } from '../utils/gameRulesHelpers';
import { StartMode } from './types';

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
    selectPiece: typeof selectPiece,
    setOpponentLeftState: typeof setOpponentLeftState
}
interface OwnProps {
    gameType: GameType | null,
    gameId: string | null,
    startMode: StartMode
}
type Props = StateProps & DispatchProps & OwnProps;

function GameBoard(props: Props) {
    const [initialized, setInitialized] = useState(false);

    // Init game on server
    useEffect(() => {
        let loadingMessage = props.startMode === StartMode.Start? 'Initializing a new game...' : 'Connecting...';
        runBlockingAsync(initializeAsync, loadingMessage, props.setBlockingUI);

        return () => {
            console.debug("GameBoard is unmounted");
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    async function initializeAsync() {
        if(initialized){
           return 
        }
        await initGameAsync(props);
        setInitialized(true);
    }

    return (
        <>
            { props.blockingUI.blocking ? <LoadingSpinner message={props.blockingUI.blockingMessage} /> : <></> }
            <div style={{opacity: props.blockingUI.blocking? 0.2 : 1}}>
                <GameBoardCore {...props}/>
                <div className='container' style={{marginTop: 24}}>
                    <div className='row justify-content-center'>
                        <ResetGameVsComputerButton {...props} />
                        <ReplayButton {...props} />
                        <ExitGameButton {...props} />
                    </div>
                </div>
            </div>
        </>
    );
}

async function initGameAsync(props: Props) {
    await backendService.connectAsync();

    let gameState: GameState;
    // initiate game on server first
    switch (props.startMode) {
        case StartMode.Start: {
            if(!props.gameType) {
                throw new Error("GameType prop is required");
            }
            let initRequest: InitGameRequest = {
                gameType: props.gameType,
                userName: props.user.name,
                // TODO: Make this configurable
                userTurn: PlayerTurn.ONE
            }
            gameState = await backendService.initGameAsync(initRequest);
            
            break;
        }
        case StartMode.Join: {
            if(!props.gameId) {
                throw new Error("GameId parameter is required");
            }
            let joinRequest: JoinPrivateGameRequest = {
                gameId: props.gameId,
                userName: props.user.name
            }
            gameState = await backendService.joinPrivateGameAsync(joinRequest);
        }
    }

    if(!gameState) {
        throw new Error("New state cannot be falsy, value: " + gameState);
    }
    console.debug("Initialized game on server, State: ", gameState);
    backendService.registerGameNotificationHandler((notification: GameNotification) => {
        const action: GameAction | null = notification.lastAction;
        let visualizableAction = false;
        if(action) {
            let movePiece = action as MovePieceAction;
            if(movePiece && movePiece.from && movePiece.to){
                visualizableAction = true;
                props.selectPiece(movePiece.from);
            }
        }
        let stateApplicationDelay = visualizableAction ? 750 : 0;
        setTimeout(() => {
            props.applyGameState(notification.newGameState); //TODO: handle cae where component is unmounted
        }, stateApplicationDelay);
    });
    backendService.registerOpponentLeftNotificationHandler(() => {
        console.debug("Received notification: Opponent left the game")
        props.setOpponentLeftState();
    });
    props.applyGameState(gameState);
}

function quitCurrentGame(props: Props) {
    runBlockingAsync(async () => {
        await quitGameOnServerAsync(props);
        props.resetGameState();
        backendService.clearGameNotificationHandler();
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
    if(props.game.type !== GameType.VS_COMPUTER) return false;
    if(props.game.stage !== GameStage.PLAYING && props.game.stage !== GameStage.GAME_OVER) return false;

    let connected = backendService.isConnected();
    let firstTurn = props.game.boardState != null && props.game.boardState.turnNumber <= 1;
    return connected && !firstTurn;
}

function canQuitGame(props: Props): boolean {
    return props.game.stage !== GameStage.UNINITIALIZED
}

function canReinitializeGame(props: Props): boolean {
    if(props.game.stage === GameStage.UNINITIALIZED) return false;
    if(props.game.type !== GameType.VS_RANDOM_PLAYER) return false;

    return backendService.isConnected() && (props.game.stage === GameStage.GAME_OVER || props.game.stage === GameStage.OPPONENT_LEFT);
}

function ExitGameButton(props: Props) {
    return (
    <Link className='col col-auto btn btn-lg btn-danger' to='' 
        style={{display: canQuitGame(props) ? 'inline' : 'none'}} 
        onClick={() => quitCurrentGame(props)}>EXIT</Link>
    );
}

function ResetGameVsComputerButton(props: Props) {
    return (
    <button className='col col-auto btn btn-lg btn-primary mr-3' 
        style={{display: canResetGame(props) ? 'inline' : 'none'}} 
        onClick={() => resetCurrentGame(props)}>RESET</button>
    );
}

function ReplayButton(props: Props) {
    return (
        <button className='col col-auto btn btn-lg btn-primary mr-3' 
        style={{display: canReinitializeGame(props) ? 'inline' : 'none'}} 
        onClick={async () => await initGameAsync(props)}>New game</button>
    );
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
            if(props.game.type === GameType.VS_RANDOM_PLAYER) {
                return (
                    <>
                    <h4 className="text-center">Waiting for a player to join the game</h4>
                    <SmallLoadingSpinner />
                    </>
                );
            }
            else if(props.game.type === GameType.VS_FRIEND) {
                return (
                    <WaitingForOpponentInPrivateGame {...props} />
                );
            }
            else{
                throw new Error(`Unsupported game type ${props.game.type} when waiting for opponent`)
            }
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

function WaitingForOpponentInPrivateGame(props: Props) {
    const [joinGameUrl, setJoinGameUrl] = useState("");
    const [copiedUrl, setCopiedUrl] = useState(false);
    useEffect(() => {
        setJoinGameUrl(`${window.location.origin.toString()}/join/${props.game.id}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    function copyGameUrl() {
        if(window.isSecureContext) {
            navigator.clipboard.writeText(joinGameUrl);
            setTimeout(() => {setCopiedUrl(false)}, 1000);
            setCopiedUrl(true);
        }
    }
    
    let copyButtonClass = copiedUrl ? 'btn btn-success' : 'btn btn-primary';
    return (
        <>
            <h4 className="text-center">Waiting for opponent</h4>
            <SmallLoadingSpinner />
            <h5 className="text-center mt-5">Share the link with your friend</h5>
            <div className="input-group mb-3">
                <input type="text" className="form-control" readOnly
                    aria-label="Amount (to the nearest dollar)" 
                    value={joinGameUrl}/>
                <div className="input-group-append">
                    <button className={copyButtonClass} onClick={copyGameUrl}>{copiedUrl? 'Copied !' : 'Copy'}</button>
                </div>
            </div>
        </>
    );
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
        <div className="col-sm-5 text-left p-2" style={{border: playerOneBorder, borderRadius: 0}}><span className="h4" style={{color: "red"}}>{playerNames[0]}</span></div>
        {/* <div className="col-sm text-center h4">{turnCount}</div> */}
        <div className="col-sm-5 text-right p-2" style={{border: playerTwoBorder, borderRadius: 0}}><span className="h4" style={{color: "blue"}}>{playerNames[1]}</span></div>
    </div>
    </div>
    );
}

function SmallLoadingSpinner() {
    return (
        <div className="row justify-content-center mt-3">
            <div className="spinner-border spinner" role="status" style={{opacity: 0.5}}></div>
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
    selectPiece: selectPiece,
    setBlockingUI: setBlockingUI
}
export default connect<StateProps, DispatchProps, OwnProps, ApplicationState>(
    mapState,
    mapDispatch
)(GameBoard)


