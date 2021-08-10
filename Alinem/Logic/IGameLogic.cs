using Alinem.Models;

namespace Alinem.Logic
{
	public interface IGameLogic
	{
		bool ValidateGameAction(GameActionRequest actionRequest, GameState state);
		GameState ApplyAction(GameState currentState, GameAction action);
		GameState AddPlayer(GameState gameState, Player newPlayer);
	}
}
