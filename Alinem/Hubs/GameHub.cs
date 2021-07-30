using System;
using System.Threading.Tasks;
using Alinem.Logic;
using Alinem.Models;
using Microsoft.AspNetCore.SignalR;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

namespace Alinem.Hubs
{
	public class GameHub : Hub<IGameClient>
	{
		private readonly IServerState serverState;
		private readonly IGameLogic gameLogic;
		private readonly IGameAI gameAI;

		public GameHub(IServerState serverState, IGameLogic gameLogic, IGameAI gameAI)
		{
			this.serverState = serverState;
			this.gameLogic = gameLogic;
			this.gameAI = gameAI;
		}

		[HubMethodName("InitGame")]
		public async Task<GameState> InitGameAsync(InitGameRequest request)
		{
			await Task.Delay(500).ConfigureAwait(false);

			if (request.GameType != GameType.VS_COMPUTER)
			{
				throw new NotImplementedException("Only games with computer are supported");
			}

			var player = new Player()
			{
				Id = request.User.Id,
				Name = request.User.Name,
				Type = PlayerType.HUMAN
			};

			var gameState = new GameState
			{
				Id = Guid.NewGuid().ToString("N"),
				StartTimeUtc = DateTime.UtcNow,
				
				Player1 = request.UserTurn == PlayerTurn.ONE ? player : serverState.ComputerUser,
				Player2 = request.UserTurn == PlayerTurn.TWO ? player : serverState.ComputerUser,
				BoardState = InitializeGameBoard(request),
				UserConnectionsState = new UserConnectionState[]
				{
					// Requester is connected and computer is always connected
					UserConnectionState.CONNECTED,
					UserConnectionState.CONNECTED
				}
			};

			if(!serverState.Users.TryAdd(player.Id, player))
			{
				serverState.Users.TryGetValue(player.Id, out var existing);
				throw new ArgumentException($"User with Id {player.Id} already exists, with name {existing.Name}");
			}

			if(!serverState.Games.TryAdd(gameState.Id, gameState))
			{
				serverState.Games.TryGetValue(gameState.Id, out var existing);
				throw new ArgumentException($"Game with Id {player.Id} already exists, it started at {existing.StartTimeUtc} UTC");
			}

			return gameState;
		}

		[HubMethodName("SendGameAction")]
		public async Task<GameBoardState> SendGameActionAsync(GameActionRequest actionRequest)
		{
			await Task.Delay(500).ConfigureAwait(false);

			GameState gameState;
			if(!serverState.Games.TryGetValue(actionRequest.GameId,out gameState))
			{
				throw new ArgumentException($"There is no current game with id {actionRequest.GameId}");
			}
			if(!gameLogic.ValidateGameAction(actionRequest, gameState))
			{
				// TODO: make error messages clearer
				throw new ArgumentException("Invalid move");
			}

			GameBoardState newState = gameLogic.ApplyAction(gameState.BoardState, actionRequest.Action);
			// Update state in server
			gameState.BoardState = newState;

			if(newState.Winner != null) /*Game Over*/
			{
				return newState;
			}

			Player player = GameLogicUtils.GetCurrentPlayer(gameState);
			if(player.Type == PlayerType.COMPUTER)
			{
				int difficulty = serverState.DefaultGameDifficulty;
				// Get computer's move and send new state to player
				GameAction computerAction = gameAI.CalculateComputerMove(gameState.BoardState, difficulty);

				GameBoardState afterComputerMove = gameLogic.ApplyAction(gameState.BoardState, computerAction);
				// Update state in server
				gameState.BoardState = afterComputerMove;

				return afterComputerMove;
			}
			else
			{
				// update other player who is current player after updating state
				await Clients.User(player.Id).ReceiveGameStateUpdate(gameState.BoardState).ConfigureAwait(false);
				return newState;
			}
		}

		public Task ReceiveGameStateUpdate(GameBoardState gameBoardState)
		{
			return Task.CompletedTask;
		}

		private static GameBoardState InitializeGameBoard(InitGameRequest request)
		{
			return new GameBoardState
			{
				CurrentTurn = request.UserTurn,
				Board = new PlayerTurn?[3, 3],
				Winner = null,
				TurnNumber = 1,
				GameMode = GameMode.PUT
			};
		}
	}
}
