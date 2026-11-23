using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;

namespace UiAgent
{
    /// <summary>
    /// Vertical two-color gradient for any uGUI Graphic, including sliced rounded images.
    /// Works on vertex colors, so it costs no extra textures or draw calls.
    /// </summary>
    [AddComponentMenu("UI/Effects/Vertical Gradient")]
    public class UiVerticalGradient : BaseMeshEffect
    {
        public Color top = Color.white;
        public Color bottom = Color.gray;

        static readonly List<UIVertex> Verts = new();

        public override void ModifyMesh(VertexHelper vh)
        {
            if (!IsActive() || vh.currentVertCount == 0) return;
            Verts.Clear();
            vh.GetUIVertexStream(Verts);
            var rect = graphic.rectTransform.rect;
            float h = Mathf.Max(1f, rect.height);
            for (int i = 0; i < Verts.Count; i++)
            {
                var v = Verts[i];
                float t = Mathf.Clamp01((v.position.y - rect.yMin) / h);
                v.color = (Color32)(Color.Lerp(bottom, top, t) * (Color)v.color);
                Verts[i] = v;
            }
            vh.Clear();
            vh.AddUIVertexTriangleStream(Verts);
        }
    }
}
