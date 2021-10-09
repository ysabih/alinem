using System;

namespace Alinem.Models
{
    public class GameNotFoundException : Exception
    {
        public string GameId { get; private set; }

        public GameNotFoundException(string gameId)
        {
            GameId = gameId;
        }
    }
}
