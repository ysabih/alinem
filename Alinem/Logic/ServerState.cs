using Alinem.Models;
using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;

namespace Alinem.Logic
{
	public class ServerState : IServerState
	{
		private static readonly Player ComputerPlayer = new Player
		{
			Id = "5c28d7b43e6140c894d26d5ec409ed8ebf9de1dc4f61",
			Name = "BOT",
			Type = PlayerType.COMPUTER
		};
		private static readonly ConcurrentDictionary<string, Player> Users = new ConcurrentDictionary<string, Player>(
			new Dictionary<string, Player>() { { ComputerPlayer.Id, ComputerPlayer } });
		private static readonly ConcurrentDictionary<string, GameState> Games = new ConcurrentDictionary<string, GameState>();

		private static HashSet<string> OpenGames = new HashSet<string>();
		private static object OpenGamesLock = new object();

		private static readonly int DefaultGameDifficulty = 3;

		Player IServerState.ComputerUser => ComputerPlayer;
		ConcurrentDictionary<string, Player> IServerState.Users => Users;
		ConcurrentDictionary<string, GameState> IServerState.Games => Games;

		int IServerState.DefaultGameDifficulty => DefaultGameDifficulty;

		public void AddOpenGameId(string gameId)
		{
			lock(OpenGamesLock)
			{
				if(!OpenGames.Add(gameId))
				{
					throw new ArgumentException($"GameId {gameId} already added");
				}
			}
		}

		public string PopRandomOpenGameId()
		{
			lock(OpenGamesLock)
			{
				string first = OpenGames.FirstOrDefault();
				if(first != null)
				{
					OpenGames.Remove(first);
				}
				return first;
			}
		}

		public void TryRemoveOpenGame(string gameId)
		{
			lock (OpenGamesLock)
			{
				OpenGames.Remove(gameId);
			}
		}
	}
}
