using System.Collections.Generic;
using System.IO;
using UnityEditor;
using UnityEngine;
using UnityEngine.UI;

namespace UiAgent
{
    /// <summary>Builds a uGUI hierarchy from a UiSpec and saves it as a prefab.</summary>
    public static class UiBuilder
    {
        public const string RootName = "UiAgentCanvas";
        const string GeneratedDir = "Assets/UiAgent/Generated";
        const string OutputDir = "Assets/UiAgent/Output";

        static Font _font;
        static Font DefaultFont => _font ? _font : (_font = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf"));

        public static GameObject Build(UiSpec spec, out List<string> report)
        {
            report = new List<string>();
            Clear();

            var root = new GameObject(RootName, typeof(RectTransform), typeof(Canvas), typeof(CanvasScaler), typeof(GraphicRaycaster));
            root.layer = 5; // UI
            var canvas = root.GetComponent<Canvas>();
            canvas.renderMode = RenderMode.ScreenSpaceOverlay;
            var scaler = root.GetComponent<CanvasScaler>();
            scaler.uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize;
            scaler.referenceResolution = new Vector2(spec.canvas.width, spec.canvas.height);
            scaler.matchWidthOrHeight = 0.5f;

            var bg = CreateChild(root.transform, "Background");
            Stretch(bg);
            bg.gameObject.AddComponent<Image>().color = ParseColor(spec.canvas.background);

            var size = new Vector2(spec.canvas.width, spec.canvas.height);
            var used = new HashSet<string>();
            int index = 0;
            foreach (var e in spec.elements ?? new ElementSpec[0])
            {
                index++;
                string name = UniqueName(string.IsNullOrEmpty(e.id) ? $"{e.type}_{index}" : e.id, used);
                var rt = CreateChild(root.transform, name);
                Place(rt, e.rect, size);
                switch ((e.type ?? "panel").ToLowerInvariant())
                {
                    case "text": AddText(rt, e, e.text ?? "", e.color); break;
                    case "button": AddBox(rt, e); rt.gameObject.AddComponent<Button>(); if (!string.IsNullOrEmpty(e.text)) AddLabel(rt, e); break;
                    case "circle": AddCircle(rt, e); break;
                    case "progress": AddProgress(rt, e); break;
                    default: AddBox(rt, e); if (!string.IsNullOrEmpty(e.text)) AddLabel(rt, e); break;
                }
                report.Add($"{name} ({e.type}) at [{e.rect[0]:0},{e.rect[1]:0},{e.rect[2]:0},{e.rect[3]:0}] anchor {AnchorName(rt)}");
            }
            return root;
        }

        public static string SavePrefab(GameObject root, string name)
        {
            Directory.CreateDirectory(OutputDir);
            string path = $"{OutputDir}/{Sanitize(name)}.prefab";
            PrefabUtility.SaveAsPrefabAsset(root, path);
            return path;
        }

        public static void Clear()
        {
            foreach (var go in Object.FindObjectsByType<Canvas>(FindObjectsInactive.Include, FindObjectsSortMode.None))
                if (go && go.name == RootName) Object.DestroyImmediate(go.gameObject);
        }

        public static string Hierarchy()
        {
            var root = GameObject.Find(RootName);
            if (!root) return "(no UI built)";
            var sb = new System.Text.StringBuilder();
            foreach (RectTransform child in root.transform)
            {
                var g = child.GetComponent<Graphic>();
                var t = child.GetComponentInChildren<Text>();
                sb.AppendLine($"{child.name}: pos {child.anchoredPosition}, size {child.sizeDelta}, anchor {AnchorName(child)}" +
                              (g ? $", color #{ColorUtility.ToHtmlStringRGB(g.color)}" : "") +
                              (t ? $", text \"{t.text}\"" : ""));
            }
            return sb.ToString();
        }

        // Elements are anchored to the nearest edge of the screen, the way a person would set them up,
        // so the layout survives other aspect ratios instead of drifting from the center.
        static void Place(RectTransform rt, float[] r, Vector2 size)
        {
            float x = r[0], y = r[1], w = r[2], h = r[3];
            float cx = (x + w / 2f) / size.x, cy = (y + h / 2f) / size.y;
            float ax = cx < 0.34f ? 0f : cx > 0.66f ? 1f : 0.5f;
            float ay = cy < 0.34f ? 1f : cy > 0.66f ? 0f : 0.5f; // top of the screen is y=1 in Unity
            if (w >= size.x * 0.9f) ax = 0.5f;
            rt.anchorMin = rt.anchorMax = new Vector2(ax, ay);
            rt.pivot = new Vector2(0.5f, 0.5f);
            rt.sizeDelta = new Vector2(w, h);
            var centerFromTopLeft = new Vector2(x + w / 2f, y + h / 2f);
            var anchorPos = new Vector2(ax * size.x, (1f - ay) * size.y);
            rt.anchoredPosition = new Vector2(centerFromTopLeft.x - anchorPos.x, -(centerFromTopLeft.y - anchorPos.y));
        }

        static void AddBox(RectTransform rt, ElementSpec e)
        {
            var img = rt.gameObject.AddComponent<Image>();
            img.color = ParseColor(e.color);
            if (e.radius > 0.5f)
            {
                img.sprite = RoundedSprite(Mathf.RoundToInt(e.radius));
                img.type = Image.Type.Sliced;
            }
            if (!string.IsNullOrEmpty(e.outline))
            {
                var o = rt.gameObject.AddComponent<Outline>();
                o.effectColor = ParseColor(e.outline);
                o.effectDistance = new Vector2(e.outlineWidth, -e.outlineWidth);
            }
        }

        static void AddCircle(RectTransform rt, ElementSpec e)
        {
            var img = rt.gameObject.AddComponent<Image>();
            img.color = ParseColor(e.color);
            img.sprite = CircleSprite();
            img.preserveAspect = false;
        }

        static void AddProgress(RectTransform rt, ElementSpec e)
        {
            AddBox(rt, e);
            var fill = CreateChild(rt, "Fill");
            fill.anchorMin = Vector2.zero;
            fill.anchorMax = new Vector2(Mathf.Clamp01(e.value), 1f);
            fill.offsetMin = fill.offsetMax = Vector2.zero;
            var img = fill.gameObject.AddComponent<Image>();
            img.color = ParseColor(e.fill);
            if (e.radius > 0.5f) { img.sprite = RoundedSprite(Mathf.RoundToInt(e.radius)); img.type = Image.Type.Sliced; }
            if (!string.IsNullOrEmpty(e.text)) AddLabel(rt, e);
        }

        static void AddLabel(RectTransform parent, ElementSpec e)
        {
            var label = CreateChild(parent, "Label");
            Stretch(label);
            AddText(label, e, e.text, e.textColor);
        }

        static void AddText(RectTransform rt, ElementSpec e, string text, string color)
        {
            var t = rt.gameObject.AddComponent<Text>();
            t.font = DefaultFont;
            t.text = text;
            t.fontSize = e.fontSize;
            t.fontStyle = e.bold ? FontStyle.Bold : FontStyle.Normal;
            t.color = ParseColor(color);
            t.horizontalOverflow = HorizontalWrapMode.Wrap;
            t.verticalOverflow = VerticalWrapMode.Overflow;
            t.alignment = (e.align ?? "center").ToLowerInvariant() switch
            {
                "left" => TextAnchor.MiddleLeft,
                "right" => TextAnchor.MiddleRight,
                _ => TextAnchor.MiddleCenter
            };
            t.raycastTarget = false;
        }

        // ---------- sprites, generated once and kept as assets so the prefab stays valid ----------

        static Sprite RoundedSprite(int radius)
        {
            radius = Mathf.Clamp(radius, 2, 128);
            string path = $"{GeneratedDir}/rounded_{radius}.png";
            var existing = AssetDatabase.LoadAssetAtPath<Sprite>(path);
            if (existing) return existing;
            int size = radius * 2 + 4;
            var tex = new Texture2D(size, size, TextureFormat.RGBA32, false);
            for (int y = 0; y < size; y++)
            for (int x = 0; x < size; x++)
            {
                float dx = Mathf.Max(0, Mathf.Max(radius - x - 0.5f, x + 0.5f - (size - radius)));
                float dy = Mathf.Max(0, Mathf.Max(radius - y - 0.5f, y + 0.5f - (size - radius)));
                float d = Mathf.Sqrt(dx * dx + dy * dy);
                float a = Mathf.Clamp01(radius - d + 0.5f);
                tex.SetPixel(x, y, new Color(1, 1, 1, a));
            }
            return SaveSprite(tex, path, new Vector4(radius, radius, radius, radius));
        }

        static Sprite CircleSprite()
        {
            string path = $"{GeneratedDir}/circle.png";
            var existing = AssetDatabase.LoadAssetAtPath<Sprite>(path);
            if (existing) return existing;
            int size = 256; float r = size / 2f;
            var tex = new Texture2D(size, size, TextureFormat.RGBA32, false);
            for (int y = 0; y < size; y++)
            for (int x = 0; x < size; x++)
            {
                float d = Vector2.Distance(new Vector2(x + 0.5f, y + 0.5f), new Vector2(r, r));
                tex.SetPixel(x, y, new Color(1, 1, 1, Mathf.Clamp01(r - d)));
            }
            return SaveSprite(tex, path, Vector4.zero);
        }

        static Sprite SaveSprite(Texture2D tex, string path, Vector4 border)
        {
            Directory.CreateDirectory(GeneratedDir);
            File.WriteAllBytes(path, tex.EncodeToPNG());
            Object.DestroyImmediate(tex);
            AssetDatabase.ImportAsset(path, ImportAssetOptions.ForceSynchronousImport);
            var imp = (TextureImporter)AssetImporter.GetAtPath(path);
            imp.textureType = TextureImporterType.Sprite;
            imp.spriteImportMode = SpriteImportMode.Single;
            imp.spriteBorder = border;
            imp.alphaIsTransparency = true;
            imp.mipmapEnabled = false;
            imp.SaveAndReimport();
            return AssetDatabase.LoadAssetAtPath<Sprite>(path);
        }

        // ---------- helpers ----------

        static RectTransform CreateChild(Transform parent, string name)
        {
            var go = new GameObject(name, typeof(RectTransform));
            go.layer = 5; // UI
            go.transform.SetParent(parent, false);
            return (RectTransform)go.transform;
        }

        static void Stretch(RectTransform rt)
        {
            rt.anchorMin = Vector2.zero; rt.anchorMax = Vector2.one;
            rt.offsetMin = rt.offsetMax = Vector2.zero;
        }

        static string AnchorName(RectTransform rt)
        {
            var a = rt.anchorMin;
            string v = a.y >= 1 ? "top" : a.y <= 0 ? "bottom" : "middle";
            string h = a.x <= 0 ? "left" : a.x >= 1 ? "right" : "center";
            return $"{v}-{h}";
        }

        public static Color ParseColor(string hex)
        {
            if (!string.IsNullOrEmpty(hex) && ColorUtility.TryParseHtmlString(hex.StartsWith("#") ? hex : "#" + hex, out var c)) return c;
            return Color.magenta;
        }

        static string UniqueName(string n, HashSet<string> used)
        {
            n = Sanitize(n); string r = n; int i = 2;
            while (!used.Add(r)) r = $"{n}_{i++}";
            return r;
        }

        static string Sanitize(string s)
        {
            foreach (var c in Path.GetInvalidFileNameChars()) s = s.Replace(c, '_');
            return s.Replace(' ', '_');
        }
    }
}
