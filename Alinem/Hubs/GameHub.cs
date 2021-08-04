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
			string userId = ExtractUserId();

			var player = new Player()
			{
				Id = userId,
				Name = request.UserName,
				Type = PlayerType.HUMAN
			};

			var gameState = new GameState
			{
				Id = Guid.NewGuid().ToString("N"),
				StartTimeUtc = DateTime.UtcNow,
				
				Player1 = request.UserTurn == PlayerTurn.ONE ? player : serverState.ComputerUser,
				Player2 = request.UserTurn == PlayerTurn.TWO ? player : serverState.ComputerUser,
				BoardState = InitializeGameBoard(request.UserTurn),
				UserConnectionsState = new UserConnectionState[]
				{
					// Requester is connected and computer is always connected
					UserConnectionState.CONNECTED,
					UserConnectionState.CONNECTED
				}
			};

			// User can quit game and start a new one in the same session => No need to check if user is already registered
			serverState.Users.TryAdd(player.Id, player);

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

		[HubMethodName("ResetGame")]
		public async Task<GameBoardState> ResetGameAsync(ResetGameRequest request)
		{
			await Task.Delay(500).ConfigureAwait(false);
			string userId = ExtractUserId();
			GameState gameState;
			bool gameExists = serverState.Games.TryGetValue(request.GameId, out gameState);
			bool validUserId = false;  
			if(gameExists)
			{
				validUserId = gameState.Player1.Id == userId || gameState.Player2.Id == userId;
			}
			if(!gameExists || !validUserId)
			{
				throw new ArgumentException($"Game with id {request.GameId} not found");
			}
			
			if(!GameCanBeReset(gameState))
			{
				throw new ArgumentException("Game cannot be reset, only games vs computer and finished games can be reset");
			}

			gameState.BoardState = InitializeGameBoard(request.UserTurn);
			//return Task.FromResult(gameState.BoardState);
			return gameState.BoardState;
		}

		[HubMethodName("QuitGame")]
		public Task QuitGameAsync(QuitGameRequest request)
		{
			string userId = ExtractUserId();
			// If game is vs computer delete it. If it's vs another player, send them notification then delete it.
			// TODO: Factorize duplicate authorization code
			GameState gameState;
			bool gameExists = serverState.Games.TryGetValue(request.GameId, out gameState);
			bool validUserId = false;
			if (gameExists)
			{
				validUserId = gameState.Player1.Id == userId || gameState.Player2.Id == userId;
			}
			if (!gameExists || !validUserId)
			{
				throw new ArgumentException($"Game with id {request.GameId} not found");
			}

			if(!IsVsComputer(gameState))
			{
				throw new NotImplementedException("Only games vs computer are supported");
			}

			serverState.Games.TryRemove(gameState.Id, out _);
			return Task.CompletedTask;
		}

		public Task ReceiveGameStateUpdate(GameBoardState gameBoardState)
		{
			return Task.CompletedTask;
		}

		private string ExtractUserId()
		{
			return Context.ConnectionId;
		}

		private static GameBoardState InitializeGameBoard(PlayerTurn firstTurn)
		{
			return new GameBoardState
			{
				CurrentTurn = firstTurn,
				Board = new PlayerTurn?[3, 3],
				Winner = null,
				TurnNumber = 1,
				GameMode = GameMode.PUT
			};
		}

		private static bool GameCanBeReset(GameState gameState)
		{
			bool vsComputer = IsVsComputer(gameState);
			bool gameOver = gameState.BoardState.Winner != null;

			return vsComputer || gameOver;
		}

		private static bool IsVsComputer(GameState gameState)
		{
			return gameState.Player1.Type == PlayerType.COMPUTER || gameState.Player2.Type == PlayerType.COMPUTER;
		}
	}
}
