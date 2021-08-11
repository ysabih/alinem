using Alinem.Models;
using System;
using System.Diagnostics.CodeAnalysis;

namespace Alinem.Logic
{
	public class GameLogic : IGameLogic
	{
		// No validation needed here
		public GameState ApplyAction([DisallowNull] GameState currentState, [DisallowNull] GameAction action)
		{
			PlayerTurn currentTurn = currentState.BoardState.CurrentTurn;
			int currentTurnNumber = currentState.BoardState.TurnNumber;
			PlayerTurn?[,] currentBoard = currentState.BoardState.Board;

			PlayerTurn?[,] newBoard = new PlayerTurn?[currentBoard.GetLength(0), currentBoard.GetLength(1)];
			Array.Copy(currentBoard, newBoard, currentBoard.Length);

			if(action is PutPieceAction putPieceAction)
			{
				newBoard[putPieceAction.Position.Y, putPieceAction.Position.X] = currentTurn;
			}
			else if(action is MovePieceAction movePieceAction)
			{
				newBoard[movePieceAction.To.Y, movePieceAction.To.X] = currentTurn;
				newBoard[movePieceAction.From.Y, movePieceAction.From.X] = null;
			}

			PlayerTurn? winner = null;
			// No need to check if other player is winner
			if (GameLogicUtils.IsWinner(newBoard, currentTurn))
				winner = currentTurn;

			GameBoardState newBoardState = new GameBoardState
			{
				TurnNumber = currentTurnNumber + 1,
				Board = newBoard,
				CurrentTurn = GameLogicUtils.Next(currentTurn),
				GameMode = currentTurnNumber < 6 ? GameMode.PUT : GameMode.MOVE,
				Winner = winner
			};

			return new GameState
			{
				Id = currentState.Id,
				Type = currentState.Type,
				StartTimeUtc = currentState.StartTimeUtc,
				Player1 = currentState.Player1,
				Player2 = currentState.Player2,
				Stage = winner == null ? GameStage.PLAYING : GameStage.GAME_OVER,
				UserConnectionsState = currentState.UserConnectionsState,
				BoardState = newBoardState
			};
		}

		public bool ValidateGameAction([DisallowNull] GameActionRequest actionRequest, [DisallowNull] GameState state)
		{
			// We have client side validation now
			// TODO: Implement it correctly
			return true;
		}

		public GameState AddPlayer([DisallowNull] GameState gameState, [DisallowNull] Player newPlayer)
		{
			// TODO: Write assertion helpers
			if(gameState.Stage != GameStage.WAITING_FOR_OPPONENT) 
			{
				throw new ArgumentException($"Invalid state: {gameState.Stage}.Game must be waiting for opponent to add another player");
			}
			if(gameState.Player1 == null)
			{
				throw new ArgumentException("Game must have a first player");
			}
			if(gameState.Player2 != null)
			{
				throw new ArgumentException("Second player must be null");
			}

			return new GameState
			{
				Id = gameState.Id,
				Type = gameState.Type,
				StartTimeUtc = gameState.StartTimeUtc,
				Player1 = gameState.Player1,
				Player2 = newPlayer,
				Stage = GameStage.PLAYING,
				UserConnectionsState = new[]
				{
					gameState.UserConnectionsState[0],
					// We assume the method was called because the new player is connected
					UserConnectionState.CONNECTED
				},
				BoardState = GameLogicUtils.InitializeGameBoard(GameLogicUtils.GetRandomTurn())
			};
		}
	}
}
