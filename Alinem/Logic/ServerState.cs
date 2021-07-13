﻿using Alinem.Models;
using System;
using System.Collections.Concurrent;
using System.Collections.Generic;

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
		private static readonly ConcurrentDictionary<Guid, GameState> Games = new ConcurrentDictionary<Guid, GameState>();

		private static readonly int DefaultGameDifficulty = 3;

		Player IServerState.ComputerUser => ComputerPlayer;
		ConcurrentDictionary<string, Player> IServerState.Users => Users;
		ConcurrentDictionary<Guid, GameState> IServerState.Games => Games;
		int IServerState.DefaultGameDifficulty => DefaultGameDifficulty;
	}
}
