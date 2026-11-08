# Galar: real sprites in the stadium cameras
**Player gets:** the stadium crowd and watching challengers are made of everyday trainer sprites (youngsters, campers, ace trainers, backpackers…), the private box shows rich folks, the commentator cut shows the reporter and cameraman, the opponent close-up shows the real opponent, the Champion cut shows the real Champion, and the rival cut shows the real rival. The Champion host's lines now show their own portrait. Intro card portraits are fitted so nobody is cropped.
**Save:** none. Presentation only.
**Checked:** every camera cut screenshotted in the browser (tests/e2e/galarStadium.spec.ts); frame, LIVE tag and corners now draw on top of the pictures.
**Limits:** crowd pictures load in the background; a cut drawn before they arrive uses the old silhouettes. Players are only Nate and Hilda, so no player sprites are used in the stands.
