# 1138 Foundation (F1 + F2)

**Player gets:** nothing yet. This is the base every later piece builds on.

**Save:** settings 42 adds `settings.expansion` (every Beta 0.6 setting at its default: Standard climax, Second Shot on, 10 heals / 6 revives per battle, mic off, minigames Normal, and so on). Run 43 adds an optional `run.expansion` block, absent until a feature writes it. Both migrations are tested (`tests/unit/expansionFoundation.test.ts`). Profile stays 20 (next free: 21).

**Limits:** nothing reads the new settings yet, so the game plays exactly as before; a replay test checks that. Setting screens come with each feature. `run.expansion` field shapes are loose until the owning slice tightens them.
