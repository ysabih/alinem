using Alinem.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Alinem.Logic
{
	// Temp game AI implementation for test purposes
	public class RandomActionGameAI : IGameAI
	{
		private readonly Random rand;

		public RandomActionGameAI()
		{
			rand = new Random();
		}

		public GameAction CalculateComputerMove(GameBoardState gameState, int difficulty)
		{	
			if(gameState.GameMode == GameMode.PUT)
			{
				// Get All empty positions and choose a random one
				List<Point> emptyPositions = GameLogicUtils.GetAllEmptyPositions(gameState.Board);
				Point chosen = emptyPositions[rand.Next(0, emptyPositions.Count + 1)];
				return new PutPieceAction { Position = chosen };
			}
			else if(gameState.GameMode == GameMode.MOVE)
			{
				//get all pieces and empty positions
				PlayerTurn currentTurn = gameState.CurrentTurn;
				var board = gameState.Board;
				List<Point> positions = GameLogicUtils.GetAllPlayerPositions(board, currentTurn);
				List<Point> emptyPositions = GameLogicUtils.GetAllEmptyPositions(board);

				var moves = new List<MovePieceAction>();
				foreach(Point piece in positions)
				{
					foreach(Point emptyPosition in emptyPositions)
					{
						if (GameLogicUtils.AreAdjacent(piece, emptyPosition))
							moves.Add(new MovePieceAction { From = piece, To = emptyPosition });
					}
				}
				return moves[rand.Next(0, emptyPositions.Count + 1)];
			}
			else
			{
				throw new ArgumentException("Unsupported game mode: " + gameState.GameMode);
			}
		}
	}
}