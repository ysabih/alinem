using Alinem.Hubs;
using Alinem.Logic;
using Alinem.Models;
using FluentAssertions;
using Microsoft.AspNetCore.SignalR.Client;
using Microsoft.Extensions.DependencyInjection;
using Newtonsoft.Json.Converters;
using NUnit.Framework;
using System;
using System.Collections.Generic;
using System.Text;
using System.Threading;
using System.Threading.Tasks;

namespace Alinem.IntegrationTests
{
	[TestFixture]
	public class GameHubTests
	{
		[Test]
		public async Task Test_Game_Vs_Computer_Async()
		{
			//TODO: make test deterministic if possible

			var initRequest = new InitGameRequest
			{
				GameType = GameType.VS_COMPUTER,
				UserName = "NoobSlayer",
				UserTurn = PlayerTurn.ONE
			};
			// Needed to test playing the game
			var gameAi = new RandomActionGameAI();
			int difficulty = 2; // Totally random
			int maxActionCount = 5;	
			int actionCount = 0;


			HubConnection connection = await StartNewConnectionAsync().ConfigureAwait(false);

			GameState initialGameState = await connection.InvokeAsync<GameState>(GameHubMethodNames.INIT_GAME, initRequest).ConfigureAwait(false);

			initialGameState.Should().NotBeNull();
			initialGameState.BoardState.Should().NotBeNull();
			initialGameState.Player1.Should().BeEquivalentTo(new Player
			{
				Id = ExtractUserId(connection),
				Name = initRequest.UserName,
				Type = PlayerType.HUMAN
			}, "Player 1 must be the one who requested new game");
			initialGameState.Stage.Should().Be(GameStage.PLAYING);
			initialGameState.Player2.Type.Should().Be(PlayerType.COMPUTER);

			// Play random moves vs computer
			GameState currentState = initialGameState;
			GameState previousState;
			while(currentState.Stage != GameStage.GAME_OVER && actionCount < maxActionCount)
			{
				actionCount++;
				GameAction nextMove = gameAi.CalculateComputerMove(currentState.BoardState, difficulty);
				GameActionRequest actionRequest = new GameActionRequest
				{
					GameId = initialGameState.Id,
					Action = nextMove
				};
				System.Console.WriteLine($"Sending game move on turn {currentState.BoardState.TurnNumber}");
				previousState = currentState;
				currentState = await connection.InvokeAsync<GameState>(GameHubMethodNames.SEND_GAME_ACTION, actionRequest).ConfigureAwait(false);

				// Check new BoardState
				if(currentState.Stage != GameStage.GAME_OVER)
				{
					currentState.BoardState.TurnNumber.Should().Be(previousState.BoardState.TurnNumber + 2);
					currentState.BoardState.CurrentTurn.Should().Be(initRequest.UserTurn);
					System.Console.WriteLine($"Current Board State after computer move:\n{ToMatrixString(currentState.BoardState.Board)}");
				}
				else
				{
					System.Console.WriteLine($"Game over, Winner is {currentState.BoardState.Winner} current state:\n{ToMatrixString(currentState.BoardState.Board)}");
				}
			}
		}

		[Test]
		public async Task Test_Game_Vs_Random_Opponent_Async()
		{
			// Test needs the list of open games on server to be empty to run reliably
			// TODO: Make this deterministic, one option is use an in-process TestServer
			#region Game initialization
			var initRequest = new InitGameRequest
			{
				UserName = "PromiscuousPlayer",
				GameType = GameType.VS_RANDOM_PLAYER
			};

			var joinRequest = new InitGameRequest
			{
				UserName = "LatePlayer",
				GameType = GameType.VS_RANDOM_PLAYER
			};

			// Request game by player1
			HubConnection firstPlayerConnection = await StartNewConnectionAsync().ConfigureAwait(false);
			GameState initialGameState = await firstPlayerConnection.InvokeAsync<GameState>(GameHubMethodNames.INIT_GAME, initRequest).ConfigureAwait(false);

			initialGameState.Should().NotBeNull();
			initialGameState.BoardState.Should().BeNull();
			initialGameState.Player1.Should().BeEquivalentTo(new Player
			{
				Id = ExtractUserId(firstPlayerConnection),
				Name = initRequest.UserName,
				Type = PlayerType.HUMAN
			}, "Player 1 must be the one who requested new game");
			initialGameState.Stage.Should().Be(GameStage.WAITING_FOR_OPPONENT);
			initialGameState.Player2.Should().Be(null);

			bool player1Notified = false;
			GameState player1NotificationGameState = null;
			Semaphore player1NotificationSem = new Semaphore(0, 1);
			// Setup gameStateUpdate message handler for player 1
			firstPlayerConnection.On<GameState>(GameHubMethodNames.RECEIVE_GAME_STATE_UPDATE, (newGameState) =>
			{
				if (!player1Notified)
				{
					// First game state update, Just store the state to compare it to state received by player2
					player1NotificationGameState = newGameState;
					player1Notified = true;
					player1NotificationSem.Release();
				}
			});

			// Request game by player2
			HubConnection secondPlayerConnection = await StartNewConnectionAsync().ConfigureAwait(false);
			secondPlayerConnection.ConnectionId.Should().NotBe(firstPlayerConnection.ConnectionId); // Just to be safe

			GameState joinedGameState = await secondPlayerConnection.InvokeAsync<GameState>(GameHubMethodNames.INIT_GAME, joinRequest).ConfigureAwait(false);

			joinedGameState.Id.Should().Be(initialGameState.Id);
			joinedGameState.Stage.Should().Be(GameStage.PLAYING);
			joinedGameState.Player2.Should().BeEquivalentTo(new Player
			{
				Id = ExtractUserId(secondPlayerConnection),
				Name = joinRequest.UserName,
				Type = PlayerType.HUMAN
			}, "Player 1 must be the one who requested new game");
			joinedGameState.BoardState.Should().NotBeNull();

			// Wait for notification handler to finish
			if (player1NotificationSem.WaitOne(80000))
			{
				player1Notified.Should().Be(true);
				joinedGameState.Should().BeEquivalentTo(player1NotificationGameState);
			}
			else
			{
				Assert.Fail("Timeout waiting for first player connection to handle notification");
			}
			#endregion

			#region Gameplay
			//Let's just play in PUT mode, the goal here is only to test game state update and notification logic not the actual game logic
			Queue<GameAction> firstMoveSeq = new Queue<GameAction>();
			firstMoveSeq.Enqueue(new PutPieceAction { Position = new Point { X = 0, Y = 0 } });
			firstMoveSeq.Enqueue(new PutPieceAction { Position = new Point { X = 0, Y = 1 } });
			firstMoveSeq.Enqueue(new PutPieceAction { Position = new Point { X = 0, Y = 2 } });

			Queue<GameAction> secondMoveSeq = new Queue<GameAction>();
			secondMoveSeq.Enqueue(new PutPieceAction { Position = new Point { X = 2, Y = 0 } });
			secondMoveSeq.Enqueue(new PutPieceAction { Position = new Point { X = 2, Y = 1 } });
			secondMoveSeq.Enqueue(new PutPieceAction { Position = new Point { X = 2, Y = 2 } });

			var gameFinishedSem = new Semaphore(0, 1);
			bool gameOver = false;
			firstPlayerConnection.On<GameState>(GameHubMethodNames.RECEIVE_GAME_STATE_UPDATE, (newGameState) =>
			{
				HandleGameStateUpdateNotificationAsync(firstPlayerConnection, newGameState).Wait();
			});

			secondPlayerConnection.On<GameState>(GameHubMethodNames.RECEIVE_GAME_STATE_UPDATE, (newGameState) =>
			{
				HandleGameStateUpdateNotificationAsync(secondPlayerConnection, newGameState);
			});

			//Play first move
			HubConnection currentPlayerConnection = joinedGameState.BoardState.CurrentTurn == PlayerTurn.ONE ? firstPlayerConnection : secondPlayerConnection;
			await HandleGameStateUpdateNotificationAsync(currentPlayerConnection, joinedGameState).ConfigureAwait(false);

			// Wait for game to finish with timeout
			gameFinishedSem.WaitOne(TimeSpan.FromSeconds(10));
			gameOver.Should().BeTrue("Game must be over");

			Task HandleGameStateUpdateNotificationAsync(HubConnection connection, GameState newGameState)
			{
				PlayerTurn currentTurn = newGameState.BoardState.CurrentTurn;
				Queue<GameAction> currentMoveSeq = currentTurn == PlayerTurn.ONE ? firstMoveSeq : secondMoveSeq;
				HubConnection currentPlayerConnection = currentTurn == PlayerTurn.ONE ? firstPlayerConnection : secondPlayerConnection;
				currentPlayerConnection.Should().Be(connection, "Connection to handle game state must correspond to the current turn");

				System.Console.WriteLine($"\nReceived game state update, turn number {newGameState.BoardState.TurnNumber}. Board state:\n{ToMatrixString(newGameState.BoardState.Board)}");
				if (newGameState.BoardState.Winner != null)
				{
					System.Console.WriteLine($"Game Over! Winner is {newGameState.BoardState.Winner}");
					gameOver = true;
					gameFinishedSem.Release();
					return Task.CompletedTask;
				}
				else
				{
					GameAction nextMove = currentMoveSeq.Dequeue();
					System.Console.WriteLine($"Sending game move {nextMove} as player {currentTurn}");
					GameActionRequest request = new GameActionRequest { GameId = newGameState.Id, Action = nextMove };
					return currentPlayerConnection.SendAsync(GameHubMethodNames.SEND_GAME_ACTION, request);
				}
			}
			#endregion
		}

		[Test]
		public async Task Test_Quit_Game_Vs_Random_Opponent_Before_Opponent_Joins()
		{
			var initRequest = new InitGameRequest
			{
				UserName = "PromiscuousPlayer",
				GameType = GameType.VS_RANDOM_PLAYER
			};

			HubConnection connection = await StartNewConnectionAsync().ConfigureAwait(false);
			GameState gameState = await connection.InvokeAsync<GameState>(GameHubMethodNames.INIT_GAME, initRequest).ConfigureAwait(false);

			gameState.Should().NotBeNull();
			gameState.BoardState.Should().BeNull();
			gameState.Player1.Should().BeEquivalentTo(new Player
			{
				Id = ExtractUserId(connection),
				Name = initRequest.UserName,
				Type = PlayerType.HUMAN
			}, "Player 1 must be the one who requested new game");
			gameState.Stage.Should().Be(GameStage.WAITING_FOR_OPPONENT);
			gameState.Player2.Should().Be(null);

			await connection.InvokeAsync(GameHubMethodNames.QUIT_GAME, new QuitGameRequest { GameId = gameState.Id }).ConfigureAwait(false);
		}

		[Test]
		public async Task Test_Opponent_Is_Notified_When_User_Quits_Game()
		{
			// TODO: Refactor duplicate code
			#region Game initialization
			var initRequest = new InitGameRequest
			{
				UserName = "PromiscuousPlayer",
				GameType = GameType.VS_RANDOM_PLAYER
			};

			var joinRequest = new InitGameRequest
			{
				UserName = "LatePlayer",
				GameType = GameType.VS_RANDOM_PLAYER
			};

			// Request game by player1
			HubConnection firstPlayerConnection = await StartNewConnectionAsync().ConfigureAwait(false);
			GameState initialGameState = await firstPlayerConnection.InvokeAsync<GameState>(GameHubMethodNames.INIT_GAME, initRequest).ConfigureAwait(false);

			initialGameState.Should().NotBeNull();
			initialGameState.BoardState.Should().BeNull();
			initialGameState.Player1.Should().BeEquivalentTo(new Player
			{
				Id = ExtractUserId(firstPlayerConnection),
				Name = initRequest.UserName,
				Type = PlayerType.HUMAN
			}, "Player 1 must be the one who requested new game");
			initialGameState.Stage.Should().Be(GameStage.WAITING_FOR_OPPONENT);
			initialGameState.Player2.Should().Be(null);

			bool player1Notified = false;
			GameState player1NotificationGameState = null;
			Semaphore player1NotificationSem = new Semaphore(0, 1);
			// Setup gameStateUpdate message handler for player 1
			firstPlayerConnection.On<GameState>(GameHubMethodNames.RECEIVE_GAME_STATE_UPDATE, (newGameState) =>
			{
				if (!player1Notified)
				{
					// First game state update, Just store the state to compare it to state received by player2
					player1NotificationGameState = newGameState;
					player1Notified = true;
					player1NotificationSem.Release();
				}
			});

			// Request game by player2
			HubConnection secondPlayerConnection = await StartNewConnectionAsync().ConfigureAwait(false);
			secondPlayerConnection.ConnectionId.Should().NotBe(firstPlayerConnection.ConnectionId); // Just to be safe

			GameState joinedGameState = await secondPlayerConnection.InvokeAsync<GameState>(GameHubMethodNames.INIT_GAME, joinRequest).ConfigureAwait(false);

			joinedGameState.Id.Should().Be(initialGameState.Id);
			joinedGameState.Stage.Should().Be(GameStage.PLAYING);
			joinedGameState.Player2.Should().BeEquivalentTo(new Player
			{
				Id = ExtractUserId(secondPlayerConnection),
				Name = joinRequest.UserName,
				Type = PlayerType.HUMAN
			}, "Player 1 must be the one who requested new game");
			joinedGameState.BoardState.Should().NotBeNull();

			// Wait for notification handler to finish
			if (player1NotificationSem.WaitOne(80000))
			{
				player1Notified.Should().Be(true);
				joinedGameState.Should().BeEquivalentTo(player1NotificationGameState);
			}
			else
			{
				Assert.Fail("Timeout waiting for first player connection to handle notification");
			}
			#endregion
			#region Player1 quits game

			bool quitNotified = false;
			Semaphore quitNotificationSem = new Semaphore(0, 1);
			secondPlayerConnection.On(GameHubMethodNames.RECEIVE_OPPONENT_QUIT_NOTIF, () =>
			{
				quitNotified = true;
				quitNotificationSem.Release();
			});

			// Send quit game message from player1
			await firstPlayerConnection.InvokeAsync(GameHubMethodNames.QUIT_GAME, new QuitGameRequest { GameId = joinedGameState.Id }).ConfigureAwait(false);

			if (quitNotificationSem.WaitOne(10000))
			{
				quitNotified.Should().Be(true, "Player2 must be notified that opponent quit game");
			}
			else
			{
				Assert.Fail("Timeout waiting for second player connection to handle opponent quit notification");
			}
			#endregion
		}

		private static async Task<HubConnection> StartNewConnectionAsync()
		{
			var connection = new HubConnectionBuilder()
			.WithUrl("http://localhost:5000/gamehub")
			.AddNewtonsoftJsonProtocol(options => {
				options.PayloadSerializerSettings.Converters.Add(new StringEnumConverter());
			})
			.Build();
			// TODO: Setup handlers for error handling (e.g. when connection to server is lost)
			await connection.StartAsync().ConfigureAwait(false);
			return connection;
		}

		private static string ExtractUserId(HubConnection connection)
		{
			return connection.ConnectionId;
		}

		// Copie from stackoverflow answer: https://stackoverflow.com/a/58880281/7248501
		public static string ToMatrixString<T>(T[,] matrix, string delimiter = "\t")
		{
			var s = new StringBuilder();
			string emptyChar = "-";
			for (var i = 0; i < matrix.GetLength(0); i++)
			{
				for (var j = 0; j < matrix.GetLength(1); j++)
				{
					string value = !matrix[i, j].Equals(default(T)) ? matrix[i, j].ToString() : emptyChar; 
					s.Append(value).Append(delimiter);
				}
				s.AppendLine();
			}
			return s.ToString();
		}
	}
}
