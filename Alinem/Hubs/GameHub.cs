using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Alinem.Models;
using Microsoft.AspNetCore.SignalR;


namespace Alinem.Hubs
{
	public class GameHub : Hub
	{
		private static ConcurrentDictionary<string, User> Users = new ConcurrentDictionary<string, User>();


	}
}
