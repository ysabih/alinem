using Alinem.Models;
using System;
using System.Collections.Concurrent;

namespace Alinem.Logic
{
	public interface IServerState
	{
		public Player ComputerUser { get; }
		public ConcurrentDictionary<string, Player> Users { get; }
		ConcurrentDictionary<Guid, GameState> Games { get; }
		public int DefaultGameDifficulty { get; }
	}
}
