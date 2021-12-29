import { HubConnection, HubConnectionBuilder, HubConnectionState, LogLevel } from '@microsoft/signalr'
import { GameBoardState, GameNotification, GameState } from '../store/gameBoard/types';
import { GameActionRequest, InitGameRequest, JoinGameResponse, JoinPrivateGameRequest, QuitGameRequest, ResetGameRequest, SignalrConnectionError, SignalrNotConnectedError } from './types';

const BacknedUrl = "http://localhost:5000";
const GamehubRoute = "gamehub"

const ServerMethodNames = {
    initGame: "InitGame",
    JoinPrivateGame: "JoinPrivateGame",
    quitGame: "QuitGame",
    resetGame: "ResetGame",
    sendGameAction: "SendGameAction",
    receiveGameStateUpdate: "ReceiveGameStateUpdate",
    receiveOpponentQuitNotif: "ReceiveOpponentQuitNotif"
}

// Game event handlers
export type GameNotificationHandler = (notification: GameNotification) => void;
export type OpponentQuitHandler = () => any;

// Connection lifecycle event handlers
export type ConnectionClosedHandler = (error: Error | undefined) => void;
export type ReconnectingHandler = ConnectionClosedHandler;
export type ReconnectedHandler = (connectionId?: string | undefined) => void;

class BackendService {

    _connection!: HubConnection;

    async connectAsync(
            // Connection closed indefinitely, cannot reconnect
            connectionClosedHandler: ConnectionClosedHandler,
            // Connection temporarily lost, reconnecting
            reconnectingHandler: ReconnectingHandler,
            // Connection restored
            reconnectedHandler: ReconnectedHandler
        ) {
        if(this._connection != null && this.isConnected()){
            return;
        }
        this._connection = new HubConnectionBuilder()
        .withUrl(`${BacknedUrl}/${GamehubRoute}`)
        // Passing list of delays, stops retrying after 3 retries
        .withAutomaticReconnect([500, 1000, 1500])
        .configureLogging(LogLevel.Information)
        .build();

        try {
            await this._connection.start();

            this._connection.onclose(connectionClosedHandler);
            this._connection.onreconnecting(reconnectingHandler);
            this._connection.onreconnected(reconnectedHandler);

            console.log("Connected to game server");
        }
        catch(error) {
            console.error("Failed to connect to game server, "+ error);
            let typedError : SignalrConnectionError = { innerError: error };
            throw typedError;
        }
    }

    getUserId(): string | null {
        if(!this._connection || this._connection.state !== HubConnectionState.Connected) {
            return null;
        }
        return this._connection.connectionId;
    }

    isConnected(): boolean {
        return this._connection && this._connection.state === HubConnectionState.Connected;
    }

    throwIfNotConnected() {
        if(!this.isConnected){
            const error: SignalrNotConnectedError = { message: "Connection to Signalr server is not open" }
            throw error;
        }
    }

    async initGameAsync(request: InitGameRequest) {
        this.throwIfNotConnected();
        let response = await this._connection.invoke(ServerMethodNames.initGame, request);
        return response as GameState;
    }

    async joinPrivateGameAsync(request: JoinPrivateGameRequest) {
        this.throwIfNotConnected();
        let response = await this._connection.invoke(ServerMethodNames.JoinPrivateGame, request);
        return response as JoinGameResponse;
    }

    // using send() because it does not wait for response from server
    quitGameAsync(request: QuitGameRequest) {
        // If not connected, the server will handle the disconnection the same way it handles a quit request
        if(this.isConnected()){
            return this._connection.send(ServerMethodNames.quitGame, request);
        }
    }

    async sendGameActionAsync(request: GameActionRequest) {
        this.throwIfNotConnected();
        let response = await this._connection.invoke(ServerMethodNames.sendGameAction, request);
        return response as GameNotification;
    }

    async resetGameAsync(request: ResetGameRequest) {
        this.throwIfNotConnected();
        let response = await this._connection.invoke(ServerMethodNames.resetGame, request);
        return response as GameBoardState;
    }

    registerGameNotificationHandler(handler: GameNotificationHandler) {
        this.throwIfNotConnected();
        this._connection.on(ServerMethodNames.receiveGameStateUpdate, (playload) => {
            let notification = playload as GameNotification;
            handler(notification);
        });
    }

    clearGameNotificationHandler() {
        this.throwIfNotConnected();
        this._connection.on(ServerMethodNames.receiveGameStateUpdate, (playload) => {/*Do nothing*/});
    }

    registerOpponentLeftNotificationHandler(handler: OpponentQuitHandler) {
        this.throwIfNotConnected();
        this._connection.on(ServerMethodNames.receiveOpponentQuitNotif, () => {
            handler()
        });
    }

    clearOpponentLeftNotificationHandler() {
        if(!this.isConnected()){
            return;
        }
        this._connection.on(ServerMethodNames.receiveOpponentQuitNotif, () => {/*Do nothing*/});
    }

    // registerConnectionLostHandler(handler: (error: Error | undefined) => void) {
    //     this.throwIfNotConnected();
    //     this._connection.onclose(handler)
    // }

    // clearConnectionLostHandler() {
    //     this._connection.onclose(() => {/*Do nothing*/}); 
    // }
}

export const backendService = new BackendService();