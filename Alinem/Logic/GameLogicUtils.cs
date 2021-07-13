using Alinem.Models;
using System;
using System.Collections.Generic;

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

		public static bool AreAdjacent(Point first, Point second)
		{
			int distX = Math.Abs(first.X - second.X);
			if (distX > 1) return false;
			int distY = Math.Abs(first.X - second.Y);
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
