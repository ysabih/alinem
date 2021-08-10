using Alinem.Models;
using System.Collections.Concurrent;

namespace Alinem.Logic
{
	public interface IServerState
	{
		public Player ComputerUser { get; }
		public ConcurrentDictionary<string, Player> Users { get; }
		ConcurrentDictionary<string, GameState> Games { get; }

		// This assumes the game's state is already added
		// TODO: merge the logic in one function
		void AddOpenGameId(string gameId);
		string RemoveRandomOpenGameId();

		public int DefaultGameDifficulty { get; }
	}
}
