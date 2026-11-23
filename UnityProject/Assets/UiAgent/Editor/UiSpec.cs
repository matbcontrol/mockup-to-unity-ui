using System;

namespace UiAgent
{
    /// <summary>
    /// Layout description the agent writes after looking at a mockup.
    /// Coordinates are canvas pixels with the origin in the top-left corner: rect = [x, y, width, height].
    /// Elements are drawn in list order, so later elements sit on top.
    /// </summary>
    [Serializable]
    public class UiSpec
    {
        public string name = "Screen";
        public CanvasSpec canvas = new CanvasSpec();
        public ElementSpec[] elements = Array.Empty<ElementSpec>();
    }

    [Serializable]
    public class CanvasSpec
    {
        public int width = 1080;
        public int height = 1920;
        public string background = "#202533";
    }

    [Serializable]
    public class ElementSpec
    {
        public string id;
        /// <summary>panel, button, text, image, circle, progress</summary>
        public string type = "panel";
        public float[] rect = { 0, 0, 100, 100 };
        public string color = "#ffffff";
        public float radius;          // rounded corners in px, panels/buttons/progress
        public string outline;        // optional border color, drawn inside the box and following the rounded corners
        public float outlineWidth = 4;
        public string gradient;       // optional bottom color: the box fades from `color` at the top to this at the bottom
        public string shadow;         // optional soft drop shadow color, alpha allowed: "#00000055"
        public float shadowOffset = 6;  // px down
        public float shadowBlur = 12;   // px of softness

        // text, and the label of a button
        public string text;
        public int fontSize = 36;
        public string textColor = "#ffffff";
        public string align = "center"; // left, center, right
        public bool bold;

        // progress bar
        public string fill = "#4caf50";
        public float value = 0.5f;
    }
}
