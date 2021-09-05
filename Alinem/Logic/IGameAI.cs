using Alinem.Models;

namespace Alinem.Logic
{
	public interface IGameAI
	{
		GameAction CalculateComputerMove(GameBoardState gameState, GameDifficulty difficulty);
	}
}
