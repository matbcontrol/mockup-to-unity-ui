using System.Collections.Generic;
using System.IO;
using UnityEngine;

namespace UiAgent
{
    /// <summary>The operations the agent can call. Used by both the HTTP bridge and batch mode.</summary>
    public static class UiAgentService
    {
        static UiSpec _last;
        static GameObject _root;

        public static string Build(string specJson)
        {
            var spec = JsonUtility.FromJson<UiSpec>(specJson);
            if (spec == null) return Error("spec is not valid JSON");
            foreach (var e in spec.elements)
                if (e.rect == null || e.rect.Length != 4) return Error($"element '{e.id}' needs rect [x, y, width, height]");
            _root = UiBuilder.Build(spec, out List<string> report);
            _last = spec;
            string prefab = UiBuilder.SavePrefab(_root, spec.name);
            return "{\"ok\":true,\"prefab\":" + Q(prefab) + ",\"elements\":" + report.Count + ",\"report\":" + Q(string.Join("\n", report)) + "}";
        }

        public static string Screenshot(string outPath)
        {
            if (_root == null || _last == null) return Error("build a UI first");
            if (string.IsNullOrEmpty(outPath)) outPath = Path.Combine(Application.dataPath, "..", "Captures", _last.name + ".png");
            string full = UiCapture.Capture(_root, _last.canvas.width, _last.canvas.height, outPath);
            return "{\"ok\":true,\"path\":" + Q(full) + ",\"width\":" + _last.canvas.width + ",\"height\":" + _last.canvas.height + "}";
        }

        public static string Hierarchy() => "{\"ok\":true,\"hierarchy\":" + Q(UiBuilder.Hierarchy()) + "}";

        public static string Clear() { UiBuilder.Clear(); _root = null; _last = null; return "{\"ok\":true}"; }

        static string Error(string msg) => "{\"ok\":false,\"error\":" + Q(msg) + "}";

        public static string Q(string s)
        {
            if (s == null) return "null";
            var sb = new System.Text.StringBuilder("\"");
            foreach (char c in s)
            {
                switch (c)
                {
                    case '"': sb.Append("\\\""); break;
                    case '\\': sb.Append("\\\\"); break;
                    case '\n': sb.Append("\\n"); break;
                    case '\r': break;
                    case '\t': sb.Append("\\t"); break;
                    default:
                        if (c < 32) sb.Append("\\u").Append(((int)c).ToString("x4")); else sb.Append(c);
                        break;
                }
            }
            return sb.Append('"').ToString();
        }
    }
}
