# MIC1: Microphone input

**Player gets**
- A new setting, Controls > Microphone (off by default). When on, screens that support it can react to how loud you are, such as a shout. The browser asks permission the first time a screen uses the mic.
- Only loudness is measured. Sound is never recorded, stored or sent anywhere.
- A button always does the same thing as the mic. With the mic off, denied or missing, every screen plays exactly as before.

**Save**
- No save change. Uses the existing `settings.expansion.micInput` (settings v42, added by the foundation).

**Limits**
- This slice is the input layer only (`src/game/micInput.ts`: loudness meter, shout detector, setting row). No screen uses it yet: the Sleeping Snorlax shout and the rhythm/cheer games will plug in when those screens land (they do not exist on beta-0.6 yet).
- The mic never touches gameplay RNG; a screen should record only the action the shout causes.
