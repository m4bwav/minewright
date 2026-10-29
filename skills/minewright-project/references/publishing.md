# Publishing a Bedrock add-on on CurseForge

Checked 2026-10-29 by posting the given.jar example (authors.curseforge.com, project 1773067). The author site is a React (MUI) app and changes often; re-check the steps on use.

## Before the browser

1. Build and pack (`npm run pack`), then stage the upload set: `python scripts/listing.py --deny "<private names>"`. It copies the `.mcaddon` and images into `listing/` and fails on a stale version or a denied word in `LISTING.md`.
2. `LISTING.md` holds every field's text: name, one-line summary, categories, the version it was tested on, licence, a Markdown description (how it works, commands, install, link to the GitHub release). Write it from the add-on's how-to-play page, in plain words for players.
3. The owner signs in themselves (GitHub sign-in works). The agent never creates the account or types a password.

## The create form (four tabs)

- **Choose Game**: Bedrock is the second Minecraft tile, the one without "Java Edition". Its class list (Addons, Maps, Skins, Texture Packs, Scripts) confirms it.
- **General**: project name (no game name or version in it), logo (opens a crop dialog; drag the corner handle out to keep the whole image, then Save As Logo), summary, class Addons, main category plus extras (filter by typing), Allow Comments.
- **Description**: switch the editor to Markdown first, then type into the textarea.
- **License**: pick from the list (type to filter, e.g. MIT); distribution "Allow distribution to 3rd party" suits an open-source add-on. Then **Create**: the owner presses it, since the project goes out under their name.

## Files and media

- **Files > Add File**: the Choose File button creates its file input only when clicked, so the browser tool cannot reach it (the one visible `input.image-input` belongs to the changelog's image button; a file put there does nothing). Stage the file through that input with the browser tool's upload, then run this in the page so the real input receives it:

```js
const img = document.querySelector('input.image-input');
window.__f = [...img.files]; img.value = '';
const orig = HTMLInputElement.prototype.click;
HTMLInputElement.prototype.click = function () {
  if (this.type === 'file' && this !== img) {
    const dt = new DataTransfer(); window.__f.forEach(f => dt.items.add(f));
    this.files = dt.files; this.dispatchEvent(new Event('change', { bubbles: true })); return;
  }
  return orig.call(this);
};
[...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'Choose File').click();
HTMLInputElement.prototype.click = orig;
```

  The file name shows next to the button and Add File turns orange. Set the display name, the game version (CurseForge's list lags the game: 26.50 was newest while 1.26.60 shipped; tag the newest listed and name the tested version in the description), Release, and a short changelog (click inside the editor's text area, not its mode switch). Add File queues it for moderation; there is no separate submit button.
- **Media > Add media > Upload or Drag Image**: the same trick, clicking the "Upload or Drag Image" tile instead (that input takes several files). Run it once and wait for "Images uploaded successfully"; a second run uploads duplicates (remove them with the bin icon on hover, then OK).

## After

The project stays hidden until a moderator approves it. Record the project ID and status in the add-on's `LISTING.md` and the handoff. A new version later: pack, `listing.py`, then Files > Add File only.
