using Alinem.Models;
using System.Collections.Concurrent;

namespace Alinem.Logic
{
	public interface IServerState
	{
		string PopRandomOpenGameId();
		void AddNewGame(GameState gameState, Player firstPlayer);
		GameState GetGameState(string gameId);
		GameState GetCurrentlyPlayedGame(string playerId);
		bool Exists(string gameId);
		void UpdateGameState(GameState newState, bool addedSecondPlayer = false);
		bool RemoveGameIfExists(string gameId);
		void TryRemovePlayer(string playerId);

		public GameDifficulty DefaultGameDifficulty { get; }
		public Player ComputerPlayer { get; }
	}
}
