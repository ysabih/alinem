﻿namespace Alinem.Hubs
{
	public static class GameHubMethodNames
	{
		public const string INIT_GAME = "InitGame";
		public const string JOIN_PRIVATE_GAME = "JoinPrivateGame";
		public const string SEND_GAME_ACTION = "SendGameAction";
		public const string RESET_GAME = "ResetGame";
		public const string QUIT_GAME = "QuitGame";
		public const string RECEIVE_GAME_STATE_UPDATE = "ReceiveGameStateUpdate";
		public const string RECEIVE_OPPONENT_QUIT_NOTIF = "ReceiveOpponentQuitNotif";
	}
}
