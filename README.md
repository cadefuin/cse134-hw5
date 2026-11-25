# CSE 134 HW 5
SSG Exercise Folder: ./ssg-exercise

## Pages to Preview:
- Home (index)
- Form with JS (form-with-js)

# Astro Commands

All commands are run from the root of the project, from a terminal:

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `npm install`             | Installs dependencies                            |
| `npm run dev`             | Starts local dev server at `localhost:4321`      |
| `npm run build`           | Build your production site to `./dist/`          |
| `npm run preview`         | Preview your build locally, before deploying     |
| `npm run astro ...`       | Run CLI commands like `astro add`, `astro check` |
| `npm run astro -- --help` | Get help using the Astro CLI                     |

## Design Note
You are a new user exploring this website. You find the "Useless Facts" section intriguing, so you want to explore what facts there are.
- Press the "Load New Fact" button
  - This requests a new fact from the Useless Facts API
- While waiting, the status message will inform the user that the new fact is being fetched.
- On success, the user will see a new fact, an updated fact count, and a status message noting the success
- If the request fails, the status message will inform the user what failed and what they can do to remedy.