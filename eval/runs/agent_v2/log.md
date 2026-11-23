# agent_v2 log
name | rounds | similarity r1 -> final | minutes | changes between rounds | could not reproduce
---|---|---|---|---|---
01_main_menu | 3 | 0.9888 -> 0.9892 | 1.3 | r2: soft button shadows replaced by hard 5px lip (blur 1), smaller title/labels; r3: restored soft coin shadow, title back to 58 (thicker glyphs overlap better) | mockup font (heavier, narrower), label baseline ~2px lower than Unity centering
02_level_complete | 2 | 0.9890 -> 0.9897 | 9.2 (incl. network cut-off) | r2: title font 34->32 to match word width, softer/wider window shadow, lighter star shadows | off-centre radial highlight on stars (only vertical gradient available), mockup font widths (score digits)
03_shop | 2 | 0.9936 -> 0.9939 | 0.7 | r2: label font sizes matched to measured cap height (buy 36->33, VIP 24->21), stronger/longer header shadow | top-left highlight on item orbs, exact header shadow falloff, mockup font
04_settings | 2 | 0.9878 -> 0.9911 | 0.9 | r2: row/button gradient endpoints re-sampled from mockup (rows were too light at the bottom), labels moved 3px left and title 3px up to match measured glyph boxes | mockup font shapes (Settings/Language), button label vertical offset
05_daily_reward | 2 | 0.9902 -> 0.9902 | 0.6 | r2: lighter coin shadows, small text +1-2px to match measured word width | off-centre highlight on reward coins, mockup font (wider glyphs); no measurable gain in r2
06_inventory | 2 | 0.9853 -> 0.9882 | 0.8 | r2: slot and SELL gradient bottoms re-sampled (were too dark), title/description font up to match word width, SELL font down | mockup font glyph shapes in title and description
07_pause | 2 | 0.9896 -> 0.9902 | 0.7 | r2: window radius 26->32 (corner profile measured row by row), RESTART/QUIT font 30->28 | button labels sit ~3px higher than in mockup (no label offset field), mockup font
08_leaderboard | 2 | 0.9872 -> 0.9901 | 0.7 | r2: row text 31->32 to close the word-width gap, title 43->42, score column moved 2px left and names 1px right to match measured glyph edges | mockup font (wider glyphs), soft row shadow falloff approximate
09_battle_hud | 2 | 0.9954 -> 0.9954 | 0.8 | r2: HP fill 0.72->0.73 to reach measured fill edge, HP/WAVE text larger to match word width, lighter ability shadows | dark drop shadow under WAVE 7 text (shadow only on boxes), radial highlights on ability orbs
10_profile | 3 | 0.9872 -> 0.9876 | 1.0 | r2: longer header shadow, lighter avatar shadow, darker stat-card shadows, name 41->43 (made it worse); r3: name back to 41, header blur 18 | off-centre highlight on avatar, mockup's heavier name font, button label ~3px high

Total wall clock (date): 07:28:56 -> 07:45:51, about 17 min including a network cut-off during 02.
