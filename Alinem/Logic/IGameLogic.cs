using Alinem.Models;

namespace Alinem.Logic
{
	public interface IGameLogic
	{
		bool ValidateGameAction(GameActionRequest actionRequest, GameState state);
		GameBoardState ApplyAction(GameBoardState currentState, GameAction action);
	}
}
