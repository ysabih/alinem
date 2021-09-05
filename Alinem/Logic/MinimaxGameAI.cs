using Alinem.Models;
using System;
using System.Collections.Generic;

namespace Alinem.Logic
{
	public class MinimaxGameAI : IGameAI
	{
		private static List<Point[]> WinningCombinations = new List<Point[]>
		{
			// Horizontal
			new Point[3] {new Point { X=0, Y=0 }, new Point { X = 1, Y = 0 }, new Point { X = 2, Y = 0 } },
			new Point[3] {new Point { X=0, Y=1 }, new Point { X = 1, Y = 1 }, new Point { X = 2, Y = 1 } },
			new Point[3] {new Point { X=0, Y=2 }, new Point { X = 1, Y = 2 }, new Point { X = 2, Y = 2 } },
			// Vertical
			new Point[3] {new Point { X=0, Y=0 }, new Point { X = 0, Y = 1 }, new Point { X = 0, Y = 2 } },
			new Point[3] {new Point { X=1, Y=0 }, new Point { X = 1, Y = 1 }, new Point { X = 1, Y = 2 } },
			new Point[3] {new Point { X=2, Y=0 }, new Point { X = 2, Y = 1 }, new Point { X = 2, Y = 2 } },
			// Diagonal
			new Point[3] {new Point { X=0, Y=0 }, new Point { X = 1, Y = 1 }, new Point { X = 2, Y = 2 } },
			new Point[3] {new Point { X=2, Y=0 }, new Point { X = 1, Y = 1 }, new Point { X = 0, Y = 2 } }
		};

		private readonly IGameLogic gameLogic;

        public MinimaxGameAI(IGameLogic gameLogic)
        {
            this.gameLogic = gameLogic;
        }

        public GameAction CalculateComputerMove(GameBoardState gameState, GameDifficulty difficulty)
		{
			int maxDepth = ToRecursiveDepth(difficulty);
			PlayerTurn maxTurn = gameState.CurrentTurn;

			List<GameAction> possibleActions = GameLogicUtils.GetAllAvailableActions(gameState);
			
			int maxEvaluation = int.MinValue;
			GameAction bestMove = null;
			foreach (GameAction action in possibleActions)
			{
				GameBoardState afterMove = gameLogic.ApplyAction(gameState, action);
				int afterMoveEvaluation = Evaluate(afterMove, maxTurn, 0, maxDepth);
				if (afterMoveEvaluation > maxEvaluation || (afterMoveEvaluation >= maxEvaluation && bestMove == null))
				{
					maxEvaluation = afterMoveEvaluation;
					bestMove = action;
				}
			}
			return bestMove;
		}

		// We assume Winner field is updated and correct => No need to recalculate winner
		int Evaluate(GameBoardState boardState, PlayerTurn maxTurn, int currentDepth, int maxDepth)
		{
			bool maximizing = boardState.CurrentTurn == maxTurn;
			if(currentDepth == maxDepth || boardState.Winner != null)
			{
				return EvaluateHeuristic(boardState, maxTurn);
			}

			List<GameAction> possibleActions = GameLogicUtils.GetAllAvailableActions(boardState);
			int evaluation;
			if(maximizing)
            {
				int maxEvaluation = int.MinValue;
				foreach(GameAction action in possibleActions)
                {
					GameBoardState afterMove = gameLogic.ApplyAction(boardState, action);
					int afterMoveEvaluation = Evaluate(afterMove, maxTurn, currentDepth + 1, maxDepth);
					if(afterMoveEvaluation > maxEvaluation)
                    {
						maxEvaluation = afterMoveEvaluation;
                    }
                }
				evaluation = maxEvaluation;
            }
			else
            {
				int minEvaluation = int.MaxValue;
				foreach (GameAction action in possibleActions)
				{
					GameBoardState afterMove = gameLogic.ApplyAction(boardState, action);
					int afterMoveEvaluation = Evaluate(afterMove, maxTurn, currentDepth + 1, maxDepth);
					if (afterMoveEvaluation < minEvaluation)
					{
						minEvaluation = afterMoveEvaluation;
					}
				}
				evaluation = minEvaluation;
			}
			return evaluation;
		}

		int EvaluateHeuristic(GameBoardState boardState, PlayerTurn maxTurn)
		{
			if(boardState.Winner != null)
			{
				return boardState.Winner == maxTurn ? int.MaxValue : int.MinValue;
			}
			int score = 0;
			foreach(Point[] winningComb in WinningCombinations)
            {
				foreach(Point position in winningComb)
                {
					PlayerTurn? piece = boardState.Board[position.Y, position.X];
					if(piece == maxTurn)
                    {
						score++;
                    }
					else if(piece == GameLogicUtils.Next(maxTurn))
                    {
						score--;
                    }
                }
            }
			return score;
		}

		int ToRecursiveDepth(GameDifficulty difficulty)
		{
			switch(difficulty)
			{
				case GameDifficulty.EASY: return 1;
				case GameDifficulty.MEDIUM: return 2;
				case GameDifficulty.HARD: return 4;
				default: throw new ArgumentException("Unsupported game difficulty " + difficulty);
			}
		}
	}
}
