import { HubConnection, HubConnectionBuilder, LogLevel } from '@microsoft/signalr'
import { GameBoardState, GameState } from '../store/gameBoard/types';
import { GameActionRequest, InitGameRequest } from './types';

const BacknedUrl = "http://localhost:5000";
const GamehubRoute = "gamehub"

const ServerMethodNames = {
    initGame: "InitGame",
    sendGameAction: "SendGameAction",
    receiveGameStateUpdate: "ReceiveGameStateUpdate",
}

class BackendService {

    connection!: HubConnection;
    connected: boolean = false;

    async connectAsync() {
        if(this.connected){
            return;
        }
        this.connection = new HubConnectionBuilder()
        .withUrl(`${BacknedUrl}/${GamehubRoute}`)
        .configureLogging(LogLevel.Information)
        .build();

        try {
            await this.connection.start();
            console.log("Connected to SignalR server");
        }
        catch(error) {
            console.error("Failed to connect, "+ error);
        }

        this.connection.onclose(error => {
            console.log(`Connection closed with error: ${error}`);
            this.connected = false;
        });
        this.connected = true;
    }

    async initGameAsync(request: InitGameRequest) {
        try{
            let response = await this.connection.invoke(ServerMethodNames.initGame, request);
            return response as GameState;
        }
        catch(error){
            console.log("Failed to initialize game, " + error);
        }
    }

    async sendGameAction(request: GameActionRequest) {
        try{
            let response = await this.connection.invoke(ServerMethodNames.sendGameAction, request);
            return response as GameBoardState;
        }
        catch(error){
            console.log("Failed to send game action, " + error);
        }
    }
}

export const backendService = new BackendService();