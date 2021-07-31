import { HubConnection, HubConnectionBuilder, HubConnectionState, LogLevel } from '@microsoft/signalr'
import { GameBoardState, GameState } from '../store/gameBoard/types';
import { GameActionRequest, InitGameRequest, QuitGameRequest, ResetGameRequest } from './types';

const BacknedUrl = "http://localhost:5000";
const GamehubRoute = "gamehub"

const ServerMethodNames = {
    initGame: "InitGame",
    quitGame: "QuitGame",
    resetGame: "ResetGame",
    sendGameAction: "SendGameAction",
    receiveGameStateUpdate: "ReceiveGameStateUpdate",
}

class BackendService {

    _connection!: HubConnection;

    async connectAsync() {
        if(this._connection != null && this.isConnected()){
            return;
        }
        this._connection = new HubConnectionBuilder()
        .withUrl(`${BacknedUrl}/${GamehubRoute}`)
        .withAutomaticReconnect()
        .configureLogging(LogLevel.Information)
        .build();

        try {
            await this._connection.start();
            console.log("Connected to SignalR server");
        }
        catch(error) {
            console.error("Failed to connect, "+ error);
        }
    }

    isConnected(): boolean {
        return this._connection && this._connection.state === HubConnectionState.Connected;
    }

    async initGameAsync(request: InitGameRequest) {
        let response = await this._connection.invoke(ServerMethodNames.initGame, request);
        return response as GameState;
    }

    // using send() because it does not wait for response from server
    quitGameAsync(request: QuitGameRequest) {
        return this._connection.send(ServerMethodNames.quitGame, request);
    }

    async sendGameActionAsync(request: GameActionRequest) {
        let response = await this._connection.invoke(ServerMethodNames.sendGameAction, request);
        return response as GameBoardState;
    }

    async resetGameAsync(request: ResetGameRequest) {
        let response = await this._connection.invoke(ServerMethodNames.resetGame, request);
        return response as GameBoardState;
    }
}

export const backendService = new BackendService();