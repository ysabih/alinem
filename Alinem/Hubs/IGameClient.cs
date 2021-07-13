using Alinem.Models;
using System.Threading.Tasks;

namespace Alinem.Hubs
{
	public interface IGameClient
	{
		Task InitGame(InitGameRequest request);
		Task<GameBoardState> SendGameAction(GameAction request);
		Task ReceiveGameStateUpdate(GameBoardState state);
	}
}
