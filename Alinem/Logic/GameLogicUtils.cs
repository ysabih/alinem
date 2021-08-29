using Alinem.Models;
using System;
using System.Collections.Generic;
using System.Linq;

namespace Alinem.Logic
{
	public static class GameLogicUtils
	{
		public static Player GetCurrentPlayer(GameState gameState)
		{
			return gameState.BoardState.CurrentTurn == PlayerTurn.ONE ? gameState.Player1 : gameState.Player2;
		}

		public static List<Point> GetAllEmptyPositions(PlayerTurn?[,] board)
		{
			return GetAllPlayerPositions(board, null);
		}

		public static GameBoardState InitializeGameBoard(PlayerTurn firstTurn)
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

		public static bool GameCanBeReset(GameState gameState)
		{
			bool vsComputer = IsVsComputer(gameState);
			bool gameOver = gameState.BoardState.Winner != null;

			return vsComputer || gameOver;
		}

		public static bool IsVsComputer(GameState gameState)
		{
			return gameState.Player1.Type == PlayerType.COMPUTER || gameState.Player2.Type == PlayerType.COMPUTER;
		}

		public static PlayerTurn GetRandomTurn()
		{
			//int num = new Random().Next(0, 1);
			//return num == 0 ? PlayerTurn.ONE : PlayerTurn.TWO;
			return PlayerTurn.ONE;
		}

		public static List<Point> GetAllPlayerPositions(PlayerTurn?[,] board, PlayerTurn? playerTurn)
		{
			List<Point> positions = new List<Point>(board.Length);
			for (int i = 0; i < board.GetLength(0); i++)
			{
				for (int k = 0; k < board.GetLength(1); k++)
				{
					if (board[i, k] == playerTurn)
					{
						positions.Add(new Point((byte)k, (byte)i));
					}
				}
			}
			return positions;
		}

		public static List<GameAction> GetAllAvailableActions(GameBoardState gameBoardState)
		{
			switch(gameBoardState.GameMode)
			{
				case GameMode.PUT:
				{
					List<Point> emptyPositions = GetAllEmptyPositions(gameBoardState.Board);
					return emptyPositions.Select(position => (GameAction)new PutPieceAction { Position = position }).ToList();
				}
				case GameMode.MOVE:
				{
					PlayerTurn currentTurn = gameBoardState.CurrentTurn;
					var board = gameBoardState.Board;
					List<Point> positions = GetAllPlayerPositions(board, currentTurn);
					List<Point> emptyPositions = GetAllEmptyPositions(board);

					var moves = new List<GameAction>();
					foreach (Point piece in positions)
					{
						foreach (Point emptyPosition in emptyPositions)
						{
							if (AreAdjacent(piece, emptyPosition))
								moves.Add(new MovePieceAction { From = piece, To = emptyPosition });
						}
					}
					return moves;
				}
				default:
					throw new ArgumentException("Invalid game mode: " + gameBoardState.GameMode);
			}
			
		}

		public static bool AreAdjacent(Point first, Point second)
		{
			int distX = Math.Abs(first.X - second.X);
			if (distX > 1) return false;
			int distY = Math.Abs(first.Y - second.Y);
			if (distY > 1) return false;
			return distX + distY <= 2;
		}

		public static bool AreCollinear(Point p1, Point p2, Point p3)
		{
			int left = (p2.Y - p1.Y) * (p3.X - p2.X);
			int right = (p3.Y - p2.Y) * (p2.X - p1.X);
			return left == right;
		}

		public static bool IsWinner(PlayerTurn?[,] board, PlayerTurn playerTurn)
		{
			List<Point> positions = GetAllPlayerPositions(board, playerTurn);
			if(positions.Count < 3)
			{
				return false;
			}
			if(positions.Count > 3)
			{
				throw new NotImplementedException("Boards larger than 3x3 are not supported");
			}

			return AreCollinear(positions[0], positions[1], positions[2]);
		}

		public static PlayerTurn Next(PlayerTurn playerTurn)
		{
			return playerTurn == PlayerTurn.ONE ? PlayerTurn.TWO : PlayerTurn.ONE;
		}
	}
}
