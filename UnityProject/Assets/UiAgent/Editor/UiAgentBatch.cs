using System;
using System.IO;
using UnityEditor;
using UnityEngine;

namespace UiAgent
{
    /// <summary>
    /// Batch entry for the evaluation: build every spec in a folder and render each one.
    /// Unity.exe -batchmode -projectPath ... -executeMethod UiAgent.UiAgentBatch.RenderFolder -specs DIR -out DIR
    /// </summary>
    public static class UiAgentBatch
    {
        public static void RenderFolder()
        {
            string specs = Arg("-specs"), outDir = Arg("-out");
            int code = 0;
            try
            {
                Directory.CreateDirectory(outDir);
                foreach (var file in Directory.GetFiles(specs, "*.json"))
                {
                    string name = Path.GetFileNameWithoutExtension(file);
                    string res = UiAgentService.Build(File.ReadAllText(file));
                    if (!res.Contains("\"ok\":true")) { Debug.LogError($"[UiAgent] {name}: {res}"); code = 1; continue; }
                    UiAgentService.Screenshot(Path.Combine(outDir, name + ".png"));
                    Debug.Log($"[UiAgent] rendered {name}");
                }
                UiAgentService.Clear();
                AssetDatabase.SaveAssets();
            }
            catch (Exception e) { Debug.LogError("[UiAgent] " + e); code = 1; }
            EditorApplication.Exit(code);
        }

        static string Arg(string name)
        {
            var a = Environment.GetCommandLineArgs();
            int i = Array.IndexOf(a, name);
            if (i < 0 || i + 1 >= a.Length) throw new ArgumentException("missing " + name);
            return a[i + 1];
        }
    }
}
