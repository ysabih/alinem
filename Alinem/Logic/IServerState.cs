using Alinem.Models;
using System.Collections.Concurrent;

namespace Alinem.Logic
{
	public interface IServerState
	{
		string PopRandomOpenGameId();
		void AddNewGame(GameState gameState);
		GameState GetGameState(string gameId);
		bool Exists(string gameId);
		void UpdateGameState(GameState newState);
		bool RemoveGameIfExists(string gameId);
		void AddOrUpdatePlayer(Player player);

		public int DefaultGameDifficulty { get; }
		public Player ComputerPlayer { get; }
	}
}
