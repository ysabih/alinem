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
			GameBoardState newBoardState = ApplyAction(currentState.BoardState, action);

			return new GameState
			{
				Id = currentState.Id,
				Type = currentState.Type,
				StartTimeUtc = currentState.StartTimeUtc,
				Player1 = currentState.Player1,
				Player2 = currentState.Player2,
				Stage = newBoardState.Winner == null ? GameStage.PLAYING : GameStage.GAME_OVER,
				BoardState = newBoardState
			};
		}

		public GameBoardState ApplyAction(GameBoardState boardState, GameAction action)
		{
			PlayerTurn currentTurn = boardState.CurrentTurn;
			int currentTurnNumber = boardState.TurnNumber;
			PlayerTurn?[,] currentBoard = boardState.Board;

			PlayerTurn?[,] newBoard = new PlayerTurn?[currentBoard.GetLength(0), currentBoard.GetLength(1)];
			Array.Copy(currentBoard, newBoard, currentBoard.Length);

			if (action is PutPieceAction putPieceAction)
			{
				newBoard[putPieceAction.Position.Y, putPieceAction.Position.X] = currentTurn;
			}
			else if (action is MovePieceAction movePieceAction)
			{
				newBoard[movePieceAction.To.Y, movePieceAction.To.X] = currentTurn;
				newBoard[movePieceAction.From.Y, movePieceAction.From.X] = null;
			}

			PlayerTurn? winner = null;
			// No need to check if other player is winner
			if (GameLogicUtils.IsWinner(newBoard, currentTurn))
				winner = currentTurn;

			return new GameBoardState
			{
				TurnNumber = currentTurnNumber + 1,
				Board = newBoard,
				CurrentTurn = GameLogicUtils.Next(currentTurn),
				GameMode = currentTurnNumber < 6 ? GameMode.PUT : GameMode.MOVE,
				Winner = winner
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
				BoardState = GameLogicUtils.InitializeGameBoard(PlayerTurn.TWO)
			};
		}
    }
}
