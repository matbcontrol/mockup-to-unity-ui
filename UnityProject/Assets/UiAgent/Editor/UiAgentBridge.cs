using System;
using System.Collections.Concurrent;
using System.IO;
using System.Net;
using System.Text;
using System.Threading;
using UnityEditor;
using UnityEngine;

namespace UiAgent
{
    /// <summary>
    /// Local HTTP bridge on 127.0.0.1:8790 so the MCP server can drive the open editor.
    /// Requests are queued and executed on the main thread, because Unity APIs are not thread-safe.
    /// </summary>
    [InitializeOnLoad]
    public static class UiAgentBridge
    {
        public const int Port = 8790;
        static HttpListener _listener;
        static Thread _thread;
        static readonly ConcurrentQueue<(HttpListenerContext ctx, string body)> Queue = new();

        static UiAgentBridge()
        {
            if (Application.isBatchMode) return;
            Start();
            EditorApplication.update += Pump;
            AssemblyReloadEvents.beforeAssemblyReload += Stop;
            EditorApplication.quitting += Stop;
        }

        /// <summary>Headless mode: Unity.exe -batchmode -projectPath ... -executeMethod UiAgent.UiAgentBridge.Serve</summary>
        public static void Serve()
        {
            Start();
            EditorApplication.update += Pump;
        }

        static void Start()
        {
            try
            {
                _listener = new HttpListener();
                _listener.Prefixes.Add($"http://127.0.0.1:{Port}/");
                _listener.Start();
                _thread = new Thread(Listen) { IsBackground = true, Name = "UiAgentBridge" };
                _thread.Start();
                Debug.Log($"[UiAgent] bridge listening on http://127.0.0.1:{Port}");
            }
            catch (Exception e) { Debug.LogWarning("[UiAgent] bridge did not start: " + e.Message); }
        }

        static void Stop()
        {
            try { _listener?.Stop(); _listener?.Close(); } catch { }
            _listener = null;
        }

        static void Listen()
        {
            while (_listener != null && _listener.IsListening)
            {
                try
                {
                    var ctx = _listener.GetContext();
                    string body;
                    using (var r = new StreamReader(ctx.Request.InputStream, Encoding.UTF8)) body = r.ReadToEnd();
                    Queue.Enqueue((ctx, body));
                }
                catch { break; }
            }
        }

        static void Pump()
        {
            while (Queue.TryDequeue(out var item))
            {
                string json;
                try { json = Handle(item.ctx.Request.Url.AbsolutePath.Trim('/'), item.body); }
                catch (Exception e) { json = "{\"ok\":false,\"error\":" + UiAgentService.Q(e.Message) + "}"; }
                try
                {
                    var bytes = Encoding.UTF8.GetBytes(json);
                    item.ctx.Response.ContentType = "application/json";
                    item.ctx.Response.OutputStream.Write(bytes, 0, bytes.Length);
                    item.ctx.Response.Close();
                }
                catch { }
            }
        }

        static string Handle(string route, string body)
        {
            switch (route)
            {
                case "build": return UiAgentService.Build(body);
                case "screenshot": return UiAgentService.Screenshot(string.IsNullOrWhiteSpace(body) ? null : body.Trim());
                case "hierarchy": return UiAgentService.Hierarchy();
                case "clear": return UiAgentService.Clear();
                case "ping": return "{\"ok\":true,\"unity\":" + UiAgentService.Q(Application.unityVersion) + "}";
                case "quit": EditorApplication.delayCall += () => EditorApplication.Exit(0); return "{\"ok\":true}";
                default: return "{\"ok\":false,\"error\":\"unknown route\"}";
            }
        }
    }
}
