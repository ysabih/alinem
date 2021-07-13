using Alinem.Models;
using System;

namespace Alinem.Logic
{
	public class GameLogic : IGameLogic
	{
		// No validation needed here
		public GameBoardState ApplyAction(GameBoardState currentState, GameAction action)
		{
			PlayerTurn?[,] newBoard = new PlayerTurn?[currentState.Board.GetLength(0), currentState.Board.GetLength(1)];
			Array.Copy(currentState.Board, newBoard, currentState.Board.Length);

			if(action is PutPieceAction putPieceAction)
			{
				newBoard[putPieceAction.Position.Y, putPieceAction.Position.X] = currentState.CurrentTurn;
			}
			else if(action is MovePieceAction movePieceAction)
			{
				newBoard[movePieceAction.To.Y, movePieceAction.To.X] = currentState.CurrentTurn;
				newBoard[movePieceAction.From.Y, movePieceAction.From.X] = null;
			}

			PlayerTurn? winner = null;
			// No need to check if other player is winner
			if (GameLogicUtils.IsWinner(newBoard, currentState.CurrentTurn))
				winner = currentState.CurrentTurn;

			return new GameBoardState
			{
				TurnNumber = currentState.TurnNumber + 1,
				Board = newBoard,
				CurrentTurn = GameLogicUtils.Next(currentState.CurrentTurn),
				GameMode = currentState.TurnNumber < 6 ? GameMode.PUT : GameMode.MOVE,
				Winner = winner
			};
		}

		public bool ValidateGameAction(GameActionRequest actionRequest, GameState state)
		{
			// We have client side validation now
			// TODO: Implement it correctly
			return true;
		}
	}
}
