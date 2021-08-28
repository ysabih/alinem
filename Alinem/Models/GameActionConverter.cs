using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using Newtonsoft.Json.Serialization;
using System;

namespace Alinem.Models
{
    // Copied from Stackoverflow answer: https://stackoverflow.com/a/30579193/7248501
    public class GameActionJsonConverter : JsonConverter
    {
        static JsonSerializerSettings SpecifiedSubclassConversion = new JsonSerializerSettings() { ContractResolver = new GameActionSpecifiedConcreteClassConverter() };

        public override bool CanConvert(Type objectType)
        {
            return objectType == typeof(GameAction);
        }

        public override object ReadJson(JsonReader reader, Type objectType, object existingValue, JsonSerializer serializer)
        {
            if (reader.TokenType == JsonToken.Null) return null;

            JObject jo = JObject.Load(reader);
            if (jo["position"] != null)
            {
                return JsonConvert.DeserializeObject<PutPieceAction>(jo.ToString(), SpecifiedSubclassConversion);
            }
            else if(jo["from"] != null && jo["to"] != null)
            {
                return JsonConvert.DeserializeObject<MovePieceAction>(jo.ToString(), SpecifiedSubclassConversion);
            }
            throw new ArgumentException("Can't convert json to a game action object, json: " + jo.ToString());
        }

        public override bool CanWrite {
            get { return false; }
        }

        public override void WriteJson(JsonWriter writer, object value, JsonSerializer serializer)
        {
            throw new NotImplementedException(); // won't be called because CanWrite returns false
        }
    }

    class GameActionSpecifiedConcreteClassConverter : DefaultContractResolver
    {
        protected override JsonConverter ResolveContractConverter(Type objectType)
        {
            if (typeof(GameAction).IsAssignableFrom(objectType) && !objectType.IsAbstract)
                return null; // pretend TableSortRuleConvert is not specified (thus avoiding a stack overflow)
            return base.ResolveContractConverter(objectType);
        }
    }
}
