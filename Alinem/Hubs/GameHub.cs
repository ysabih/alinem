using System;
using System.Linq;
using System.Threading.Tasks;
using Alinem.Logic;
using Alinem.Models;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;

namespace Alinem.Hubs
{
	public class GameHub : Hub<IGameHubClient>
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

		[HubMethodName(GameHubMethodNames.INIT_GAME)]
		public async Task<GameState> InitGameAsync(InitGameRequest request)
		{
			string userId = ExtractUserId();
			var player = new Player()
			{
				Id = userId,
				Name = request.UserName,
				Type = PlayerType.HUMAN
			};

			switch(request.GameType)
			{
				case GameType.VS_COMPUTER:
				{
					return InitializeGameVsComputer(player, request.UserTurn);
				}
				case GameType.VS_RANDOM_PLAYER:
				{
					return await InitializeOrJoinGameVsRandomOpponent(player).ConfigureAwait(false);
				}
				case GameType.VS_FRIEND:
				{
					return InitializeGameVsFriend(player);
				}
				default:
					throw new ArgumentException($"Unsupported game type: ${request.GameType}");
			}
		}

		[HubMethodName(GameHubMethodNames.JOIN_PRIVATE_GAME)]
		public async Task<GameState> JoinPrivateGameAsync(JoinPrivateGameRequest request)
		{
			await Task.Delay(1000).ConfigureAwait(false);
			string userId = ExtractUserId();
			var player = new Player()
			{
				Id = userId,
				Name = request.UserName,
				Type = PlayerType.HUMAN
			};

			GameState newState = await JoinGameAsync(request.GameId, player).ConfigureAwait(true);
			return newState;
		}

		[HubMethodName(GameHubMethodNames.SEND_GAME_ACTION)]
		public async Task<GameNotification> SendGameActionAsync(GameActionRequest actionRequest)
		{
			GameState gameState = serverState.GetGameState(actionRequest.GameId);
			if(!gameLogic.ValidateGameAction(actionRequest, gameState))
			{
				// TODO: make error messages clearer
				throw new ArgumentException("Invalid move");
			}
			GameState newState = gameLogic.ApplyAction(gameState, actionRequest.Action);

			Player player = GameLogicUtils.GetCurrentPlayer(newState);
			if(player.Type == PlayerType.COMPUTER)
			{
				if(newState.Stage == GameStage.GAME_OVER)
				{
					return new GameNotification { NewGameState = newState};
				}

				int difficulty = serverState.DefaultGameDifficulty;
				// Get computer's move and return new state to player
				GameAction computerAction = gameAI.CalculateComputerMove(newState.BoardState, difficulty);
				GameState afterComputerMove = gameLogic.ApplyAction(newState, computerAction);

				serverState.UpdateGameState(afterComputerMove);
				return new GameNotification { 
					LastAction = computerAction,
					NewGameState = afterComputerMove
				};
			}
			else
			{
				serverState.UpdateGameState(newState);
				// Notify opponent
				var notification = new GameNotification
				{
					NewGameState = newState,
					LastAction = actionRequest.Action
				};
				await Clients.Client(player.Id).ReceiveGameStateUpdate(notification).ConfigureAwait(false);
				return notification;
			}
		}

		[HubMethodName(GameHubMethodNames.RESET_GAME)]
		public async Task<GameBoardState> ResetGameAsync(ResetGameRequest request)
		{
			await Task.Delay(500).ConfigureAwait(false);
			string userId = ExtractUserId();
			GameState gameState = null;
			bool gameExists = serverState.Exists(request.GameId);
			bool validUserId = false;  
			if(gameExists)
			{
				gameState = serverState.GetGameState(request.GameId);
				validUserId = gameState.Player1.Id == userId || gameState.Player2.Id == userId;
			}
			if(!gameExists || !validUserId)
			{
				throw new ArgumentException($"Game with id {request.GameId} not found");
			}
			
			if(!GameLogicUtils.GameCanBeReset(gameState))
			{
				throw new ArgumentException("Game cannot be reset, only games vs computer and finished games can be reset");
			}

			gameState.BoardState = GameLogicUtils.InitializeGameBoard(request.UserTurn);
			//return Task.FromResult(gameState.BoardState);
			return gameState.BoardState;
		}

		[HubMethodName(GameHubMethodNames.QUIT_GAME)]
		public Task QuitGameAsync(QuitGameRequest request)
		{
			string userId = ExtractUserId();
			// If game is vs computer delete it. If it's vs another player, send them notification then delete it.
			// TODO: Factorize duplicate authorization code
			GameState gameState = null;
			bool gameExists = serverState.Exists(request.GameId);
			bool validUserId = false;
			if (gameExists)
			{
				gameState = serverState.GetGameState(request.GameId);
				validUserId = gameState.Player1.Id == userId || gameState.Player2.Id == userId;
			}
			if (!gameExists || !validUserId)
			{
				throw new ArgumentException($"Game with id {request.GameId} not found");
			}

			return HandlePlayerLeftGameAsync(userId, gameState);
		}

		public override Task OnDisconnectedAsync(Exception exception)
		{
			string playerId = ExtractUserId();
			GameState gameState = serverState.GetCurrentlyPlayedGame(playerId);
			if (gameState == null) return Task.CompletedTask;

			return HandlePlayerLeftGameAsync(playerId, gameState);
		}

		private string ExtractUserId()
		{
			return Context.ConnectionId;
		}

		private async Task HandlePlayerLeftGameAsync(string playerId, GameState gameState)
		{
			bool vsHuman = gameState.Type == GameType.VS_RANDOM_PLAYER || gameState.Type == GameType.VS_FRIEND;
			if (vsHuman && gameState.Stage == GameStage.PLAYING)
			{
				// Send notification to other player
				string otherPlayerId = gameState.Player1.Id == playerId ? gameState.Player2.Id : gameState.Player1.Id;
				await Clients.Client(otherPlayerId).ReceiveOpponentQuitNotif().ConfigureAwait(false);
			}

			serverState.TryRemovePlayer(playerId);
			serverState.RemoveGameIfExists(gameState.Id);
		}

		private GameState InitializeGameVsComputer(Player player, PlayerTurn playerTurn)
		{
			var gameState = new GameState
			{
				Id = Guid.NewGuid().ToString("N"),
				Type = GameType.VS_COMPUTER,
				StartTimeUtc = DateTime.UtcNow,
				Stage = GameStage.PLAYING,
				Player1 = player,
				Player2 = serverState.ComputerPlayer,
				BoardState = GameLogicUtils.InitializeGameBoard(playerTurn)
			};
			serverState.AddNewGame(gameState, player);
			return gameState;
		}

		private async Task<GameState> InitializeOrJoinGameVsRandomOpponent(Player player)
		{
			string randomGameId = serverState.PopRandomOpenGameId();
			if (randomGameId != null)
			{
				return await JoinGameAsync(randomGameId, player).ConfigureAwait(false);
			}
			else
			{
				var gameState = new GameState
				{
					Id = Guid.NewGuid().ToString("N"),
					Type = GameType.VS_RANDOM_PLAYER,
					StartTimeUtc = DateTime.UtcNow,
					Stage = GameStage.WAITING_FOR_OPPONENT,
					Player1 = player,
					Player2 = null,
					BoardState = null, /*Board will be initialized when second player joins the game*/
				};
				serverState.AddNewGame(gameState, player);
				return gameState;
			}
		}

		private GameState InitializeGameVsFriend(Player player)
		{
			var gameState = new GameState
			{
				Id = Guid.NewGuid().ToString("N"),
				Type = GameType.VS_FRIEND,
				StartTimeUtc = DateTime.UtcNow,
				Stage = GameStage.WAITING_FOR_OPPONENT,
				Player1 = player,
				Player2 = null,
				BoardState = null, /*Board will be initialized when second player joins the game*/
			};
			serverState.AddNewGame(gameState, player);
			return gameState;
		}

		private async Task<GameState> JoinGameAsync(string gameId, Player player)
		{
			GameState gameState = serverState.GetGameState(gameId);
			GameState newState = gameLogic.AddPlayer(gameState, player);
			serverState.UpdateGameState(newState, addedSecondPlayer: true);
			// Notify opponent
			var notification = new GameNotification
			{
				NewGameState = newState
			};
			await Clients.Client(newState.Player1.Id).ReceiveGameStateUpdate(notification).ConfigureAwait(false);
			return newState;
		}
	}
}
