using System;
using System.Linq;
using System.Threading.Tasks;
using Alinem.Logic;
using Alinem.Models;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;

namespace Alinem.Hubs
{
	public class GameHub : Hub
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
			// User can quit game and start a new one in the same session => No need to check if user is already registered
			serverState.Users.TryAdd(player.Id, player);

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
				default:
					throw new ArgumentException($"Unsupported game type: ${request.GameType}");
			}
		}

		[HubMethodName(GameHubMethodNames.SEND_GAME_ACTION)]
		public async Task<GameState> SendGameActionAsync(GameActionRequest actionRequest)
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
			GameState newState = gameLogic.ApplyAction(gameState, actionRequest.Action);

			Player player = GameLogicUtils.GetCurrentPlayer(newState);
			if(player.Type == PlayerType.COMPUTER)
			{
				if(newState.Stage == GameStage.GAME_OVER)
				{
					return newState;
				}

				int difficulty = serverState.DefaultGameDifficulty;
				// Get computer's move and send new state to player
				GameAction computerAction = gameAI.CalculateComputerMove(newState.BoardState, difficulty);

				GameState afterComputerMove = gameLogic.ApplyAction(newState, computerAction);

				// Update state in server
				serverState.Games.AddOrUpdate(afterComputerMove.Id, (id) => afterComputerMove/*Will never be used*/, (id, oldState) => afterComputerMove);

				return afterComputerMove;
			}
			else
			{
				// Update state in server
				serverState.Games.AddOrUpdate(newState.Id, (id) => newState/*Will never be used*/, (id, oldState) => newState);
				//logger.LogInformation($"Sending game state update to player {player.Id}");
				// update other player who is current player after updating state
				await Clients.Client(player.Id).SendAsync(GameHubMethodNames.RECEIVE_GAME_STATE_UPDATE, newState).ConfigureAwait(false);
				return newState;
			}
		}

		[HubMethodName(GameHubMethodNames.RESET_GAME)]
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
			
			if(!GameLogicUtils.GameCanBeReset(gameState))
			{
				throw new ArgumentException("Game cannot be reset, only games vs computer and finished games can be reset");
			}

			gameState.BoardState = GameLogicUtils.InitializeGameBoard(request.UserTurn);
			//return Task.FromResult(gameState.BoardState);
			return gameState.BoardState;
		}

		[HubMethodName(GameHubMethodNames.QUIT_GAME)]
		public async Task QuitGameAsync(QuitGameRequest request)
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

			if(gameState.Type == GameType.VS_RANDOM_PLAYER)
			{
				if(gameState.Stage == GameStage.WAITING_FOR_OPPONENT)
				{
					serverState.TryRemoveOpenGame(gameState.Id);
				}
				else if(gameState.Stage == GameStage.PLAYING)
				{
					// Send notification to other player
					string otherPlayerId = gameState.Player1.Id == userId ? gameState.Player2.Id : gameState.Player1.Id;
					await Clients.Client(otherPlayerId).SendAsync(GameHubMethodNames.RECEIVE_OPPONENT_QUIT_NOTIF).ConfigureAwait(false);
				}
			}
			serverState.Games.TryRemove(gameState.Id, out _);
		}

		private string ExtractUserId()
		{
			return Context.ConnectionId;
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
				Player2 = serverState.ComputerUser,
				BoardState = GameLogicUtils.InitializeGameBoard(playerTurn),
				UserConnectionsState = new UserConnectionState[]
				{
					// Requester is connected and computer is always connected
					UserConnectionState.CONNECTED,
					UserConnectionState.CONNECTED
				}
			};

			if (!serverState.Games.TryAdd(gameState.Id, gameState))
			{
				throw new ArgumentException($"Game with Id {gameState.Id} already exists");
			}

			return gameState;
		}

		private async Task<GameState> InitializeOrJoinGameVsRandomOpponent(Player player)
		{
			string randomGameId = serverState.PopRandomOpenGameId();
			if (randomGameId != null)
			{
				// Update game state and notify opponent
				GameState gameState;
				if(!serverState.Games.TryGetValue(randomGameId, out gameState))
				{
					throw new ArgumentException($"There is no current game with id {randomGameId}");
				}
				// Update state to include new player and send notifications to players
				// TODO: Make GameState immutable and update state more properly
				GameState newState = gameLogic.AddPlayer(gameState, player);
				serverState.Games.AddOrUpdate(newState.Id, (id) => newState/*Will never be used*/, (id, oldState) => newState);

				await Clients.Client(newState.Player1.Id).SendAsync(GameHubMethodNames.RECEIVE_GAME_STATE_UPDATE, newState).ConfigureAwait(false);
				return newState;
			}
			else
			{
				// player's turn is random vs human opponents
				PlayerTurn playerTurn = GameLogicUtils.GetRandomTurn();
				var gameState = new GameState
				{
					Id = Guid.NewGuid().ToString("N"),
					Type = GameType.VS_RANDOM_PLAYER,
					StartTimeUtc = DateTime.UtcNow,
					Stage = GameStage.WAITING_FOR_OPPONENT,
					Player1 = player,
					Player2 = null,
					UserConnectionsState = new UserConnectionState[]
					{
						UserConnectionState.CONNECTED,
						UserConnectionState.NOT_CONNECTED
					}
				};

				if (!serverState.Games.TryAdd(gameState.Id, gameState))
				{
					throw new ArgumentException($"Game with Id {gameState.Id} already exists");
				}
				// Add it to open games
				serverState.AddOpenGameId(gameState.Id);

				return gameState;
			}
		}
	}
}
