using Alinem.Models;
using System.Threading.Tasks;

namespace Alinem.Hubs
{
	public interface IGameHubClient
	{
		Task ReceiveGameStateUpdate(GameNotification notification);
		Task ReceiveOpponentQuitNotif();
	}
}
