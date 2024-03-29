import React, { useEffect, useState } from 'react';
import { connect } from 'react-redux';
import { GameBoardState, GameNotification, GameStage, GameState, GameType, PlayerTurn, PlayerType, PointState} from '../store/gameBoard/types';
import { ApplicationState} from '../store/index'
import GamePosition from './GamePosition';
import { UserState } from '../store/user/types';
import { backendService } from '../server/backendService'
import LoadingSpinner from './LoadingSpinner';
import { InitGameRequest, JoinGameResponse, JoinGameResponseType, JoinPrivateGameRequest, QuitGameRequest, ResetGameRequest, ServerConnectionState, SignalrConnectionError } from '../server/types';
import { applyGameBoardState, applyGameState, resetGameState, selectPiece, setOpponentLeftState } from '../store/gameBoard/actions';
import { BlockingUIState } from '../store/ui/types';
import { setBlockingUI } from '../store/ui/actions';
import { handleGameActionNotification, runBlockingAsync } from '../utils/componentHelpers';
import { Link } from 'react-router-dom';
import { getCurrentPlayerId } from '../utils/gameRulesHelpers';
import { StartMode } from './types';
import { faCheck, faCopy } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

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
    const [initGameResponseType, setInitGameResponseType] = useState(JoinGameResponseType.SUCCESS);
    const [connectionState, setConnectionState] = useState(ServerConnectionState.UNINITIALIZED);
    // Init game on server
    useEffect(() => {
        let loadingMessage = props.startMode === StartMode.Start? 'Initializing a new game...' : 'Connecting...';
        runBlockingAsync(initializeAsync, loadingMessage, props.setBlockingUI);

        return () => {
            console.debug("GameBoard is unmounted");
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    async function initGameAsync(props: Props) 
    : Promise<JoinGameResponseType> {
    try{

        let connectionClosedHandler = (error: Error | undefined) => {
            setConnectionState(ServerConnectionState.CLOSED);
            props.setBlockingUI(false, "");
        }
        let reconnectingHandler = (error: Error | undefined) => {
            setConnectionState(ServerConnectionState.RECONNECTING);
            props.setBlockingUI(true, "Trying to reconnect...");
        }
        let reconnectedHandler = (connectionId?: string | undefined) => {
            setConnectionState(ServerConnectionState.RECONNCTED);
            console.log("Connection restored, new id: "+connectionId);
            props.setBlockingUI(false, "");
        }

        await backendService.connectAsync(connectionClosedHandler, reconnectingHandler, reconnectedHandler);
    }
    catch(error){
        let connectionFailure = error as SignalrConnectionError;
        if(connectionFailure){
            console.error(connectionFailure.innerError);
            return JoinGameResponseType.CONNECTION_TO_SERVER_FAILED;
        }
    }

    let gameState: GameState;
    let responseType: JoinGameResponseType;
    // initiate game on server first
    switch (props.startMode) {
        case StartMode.Start: {
            if(!props.gameType) {
                throw new Error("GameType prop is required");
            }
            let initRequest: InitGameRequest = {
                gameType: props.gameType,
                userName: props.user.userPreferences.userName,
                // TODO: Make this configurable
                userTurn: PlayerTurn.ONE,
                difficulty: props.user.userPreferences.gameDifficulty
            }
            gameState = await backendService.initGameAsync(initRequest);
            responseType = JoinGameResponseType.SUCCESS;
            break;
        }
        case StartMode.Join: {
            if(!props.gameId) {
                throw new Error("GameId parameter is required");
            }
            let joinRequest: JoinPrivateGameRequest = {
                gameId: props.gameId,
                userName: props.user.userPreferences.userName
            }
            const response: JoinGameResponse = await backendService.joinPrivateGameAsync(joinRequest);
            switch(response.state){
                case JoinGameResponseType.SUCCESS:
                case JoinGameResponseType.GAME_NOT_FOUND:
                {
                    gameState = response.gameState;
                    responseType = response.state;
                    break;
                }
                default:
                {
                    throw new Error(`Unexpected response type '${response.state}'`)
                }
            }
        }
    }

    if(responseType === JoinGameResponseType.GAME_NOT_FOUND) {
        return responseType; // Nothing to set up if game is not found
    }

    if(!gameState) {
        throw new Error("New state cannot be falsy, value: " + gameState);
    }
    console.debug("Initialized game on server, State: ", gameState);
    backendService.registerGameNotificationHandler((notification: GameNotification) => {
        handleGameActionNotification(notification, props.selectPiece, props.applyGameState, true);
    });
    backendService.registerOpponentLeftNotificationHandler(() => {
        console.debug("Received notification: Opponent left the game")
        props.setOpponentLeftState();
    });
    props.applyGameState(gameState);

    return responseType;
    }

    async function initializeAsync() {
        if(initialized){
           return 
        }
        
        setInitGameResponseType(await initGameAsync(props));
        setConnectionState(ServerConnectionState.CONNECTED);
        setInitialized(true);
    }

    let serverConnectionLost = connectionState === ServerConnectionState.CLOSED;

    return (
        <>
            { props.blockingUI.blocking ? <LoadingSpinner message={props.blockingUI.blockingMessage} /> : <></> }
            <div style={{opacity: props.blockingUI.blocking? 0.2 : 1}}>
                {initGameResponseType === JoinGameResponseType.SUCCESS && !serverConnectionLost ? <GameBoardCore {...props}/> : <></>}
                {initGameResponseType === JoinGameResponseType.GAME_NOT_FOUND ? <GameNotFound/> : <></>}
                {initGameResponseType === JoinGameResponseType.CONNECTION_TO_SERVER_FAILED || serverConnectionLost ? 
                    <NoConnectionToServer connectionLost={serverConnectionLost}/> : <></>}
                <div className='container mt-5'>
                    <div className='row justify-content-center'>
                        <ResetGameVsComputerButton {...props} />

                        {/* Replay button */}
                        <button className='col col-auto btn btn-lg btn-primary mr-3' 
                            style={{display: canReinitializeGame(props) ? 'inline' : 'none'}} 
                            onClick={async () => await initGameAsync(props)}
                            >New game</button>

                        <ExitGameButton {...props} />
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

function GameNotFound() {
    return (
    <>
    <div className='row'>
        <div className="col-md-8 mx-auto">
            <h4 className="text-danger">Game not found</h4>
            <h5>Please check the following:</h5>
            <ul>
                <li>The link is correct</li>
                <li>The player who sent you the link didn't quit the game</li>
            </ul>
        </div>
    </div>
    <div className='row justify-content-center' style={{marginTop: 48}}>
        <Link className='col col-auto btn btn-lg btn-primary' to=''>Home page</Link>
    </div>
    </>);
}

function NoConnectionToServer(props: {connectionLost: boolean}) {
    return (
        <div className='container'>
        <div className='row'>
            <div className="col-md-8 mx-auto">
                <h4 className="text-danger">{props.connectionLost ? "Oops, lost connection to server" : "Oops, failed to connect to the server"}</h4>
            </div>
        </div>
        <div className='row justify-content-center' style={{marginTop: 64}}>
            <button className='col col-auto btn btn-lg btn-primary' onClick={() => window.location.reload()}>Refresh</button>
        </div>
        </div>);
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
            <div className="row justify-content-center">
            <div className="input-group col-lg-3 col-md-4 col-sm-6">
                <input type="text" className="form-control" readOnly value={joinGameUrl}/>
                <div className="input-group-append">
                    <button className={copyButtonClass} onClick={copyGameUrl}>
                        {copiedUrl? <FontAwesomeIcon icon={faCheck} /> : <FontAwesomeIcon icon={faCopy} />}
                    </button>
                </div>
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
    let winnerName = "";
    if(boardState.winner != null){
        winnerName = boardState.winner === PlayerTurn.ONE ? playerNames[0] : playerNames[1];
    }
    let playerTurn = boardState.currentTurn;
    let playerCursorStyle = "2px solid black";
    let playerOneBorder = playerTurn === PlayerTurn.ONE ? playerCursorStyle : "";
    let playerTwoBorder = playerTurn === PlayerTurn.TWO ? playerCursorStyle : "";
    return(
    <div className="container mb-3 mt-4 px-0">
    <div className="row flex-nowrap w-100 justify-content-center px-0 mx-0" style={{height: '110px'}}>
        {
            boardState.winner == null ?
            <>
                <div className="col-sm-5 text-left ps-1 p-2 align-self-center" ><span className="h4 p-3" style={{color: "red", border: playerOneBorder}}>{playerNames[0]}</span></div>
                <div className="col-sm-5 text-right ps-1 p-2 align-self-center" ><span className="h4 p-3" style={{color: "blue", border: playerTwoBorder}}>{playerNames[1]}</span></div>
            </>
            : <h3 className='h2' style={{textAlign: 'center'}}>{winnerName} WINS!</h3>
        }
        
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

function getPlayerDisplayNames(props: StateProps) : string[] {
    const players = [props.game.player1, props.game.player2];
    let result: string[] = [];
    players.forEach((player) => {
        if(!player){
            result.push("<null>");
        }
        else if(player.type === PlayerType.COMPUTER) {
            result.push(`Bot (${props.game.difficulty})`);
        }
        else result.push(player.name);

    });
    return result;
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


