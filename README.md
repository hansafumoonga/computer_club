# Computer Club & Keyboard Skills

A set of browser games for a school computer club. Runs entirely in the browser: no server, no install, no accounts, nothing saved, no internet needed after loading.

* **Session 1 (Year 1-3, normal keyboard):** Click & Type Quest (mouse + keyboard lessons), Fruit Slice, Word Hunt (word search), Jump Over!, Star Blaster
* **Session 2 (Year 4-6, Makey Makey):** Piano, Jump Over!, Star Blaster, Commando Run (15 stages), Pattern Pop!

Session 2 games use only the Makey Makey's five keys: Left, Up, Down, Right and Space.

## Play it
Open `index.html` (double-click), or visit the GitHub Pages link. Click a session, then a game. Press **F11** for full screen. Sound starts after the first click.

## Put it on GitHub Pages
1. Push this folder to a GitHub repository.
2. Repository **Settings -> Pages**, choose the main branch and the `/ (root)` folder, then Save.
3. Share the link `https://<your-name>.github.io/<repo-name>/`.

## Files
* `index.html` - the page
* `css/style.css` - styling
* `css/skills.css`, `js/skills.js`, `js/skills_levels.js` - Click & Type Quest (engine + all level content)
* `js/` - one file per game plus shared code (`core.js`, `music.js`, `sprites.js`, `sprites_world.js`, `main.js`)
* `NOTES.txt` - teacher notes: which numbers change difficulty, speed, levels, fruit letters, words, music, and where the drawings live

Plain HTML, CSS and JavaScript only. No libraries, no build step.
