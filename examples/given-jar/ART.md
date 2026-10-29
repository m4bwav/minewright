# given.jar art

The sphere is named **The Given** in game (entity name, spawn egg, chat). The add-on stays "given.jar".

All art is our own: generated with ComfyUI (Z-Image Turbo and FLUX.2 Klein 4B, both Apache 2.0) on 2026-10-27.
Prompts, seeds, models and post-processing steps are in [art/PROMPTS.md](art/PROMPTS.md), the ComfyUI graphs in
`art/workflows/`. No third-party art. The HUD shows vanilla item textures by path; those are Mojang's and are not
shipped in this add-on.

## Files

| Source (art/) | Becomes | How |
|---|---|---|
| `eye_open_128.png`, `eye_red_128.png`, `eye_closed_128.png` | eye and iris regions of `resource_pack/textures/entity/watcher_{open,red,closed}.png` | `python scripts/make_textures.py` |
| `base/eye_open_128.png`, `base/eye_red_128.png`, `base/icon.png` | the bloodshot `eye_open_128.png`, `eye_red_128.png`, `icon.png` | `python scripts/bloodshot.py` (run before make_textures.py) |
| `body_64.png` (seamless) | body region, tiled | same script |
| `icon.png` (512) | `pack_icon.png` in both packs, 256 px | same script |

`resource_pack/textures/given_jar/blank.png` is a 16x16 transparent image the HUD uses to clear the item picture.

## Bloodshot (0.1.1)

`scripts/bloodshot.py` paints the 0.1.1 look onto the 0.1.0 pictures kept in `art/base/`, so the style and silhouette
stay the same. It is seeded, so every run gives the same pixels.

- Veins: branching lines grown from the outer edge of the white towards the iris, drawn at 4x and scaled down, then
  multiplied into the picture only where it is white: a ring around the pupil, bright and unsaturated pixels, and
  (calm and hunt eye) an ellipse for the eye opening so lids and lashes stay clean.
- Calm eye (`eye_open`): red veins on the white.
- Hunt eye (`eye_red`): the white is multiplied blood red (215,25,30), then darker veins on top. The iris was
  already red.
- Icon: the eye alone on black, no sphere (asked for by the player it was made for): veins on the white, the green
  iris recoloured blood red from its own brightness (fibres kept), black pupil, white highlight, cropped so the eye
  fills the icon.

Known since 0.1.0: the pupil of `eye_red_128.png` sits at about (66,69), not the centre, so the iris cube's crop is a
few pixels off on the hunt eye. Nobody noticed it in game; fix by re-centring that picture if it ever shows.

## Texture layout

Geometry: `resource_pack/models/entity/watcher.geo.json`, made by `npm run geo` (scripts/make-geo.mjs).
`texture_width` and `texture_height` are **128 UV units**. The PNGs are 256x256, so 1 UV unit = 2 pixels. A
replacement texture can be any multiple (128, 256, 512 px) as long as the regions keep the same proportions.

| Region (UV units, x y w h) | Pixels at 256 | Used by | Content |
|---|---|---|---|
| 0 0 128 64 | 0 0 256 128 | `body` bone: 208 voxel cubes (2x2xN px), box UV all at [0,0] | dark body, seamless; every cube samples a corner of it |
| 0 64 64 64 | 0 128 128 128 | `eye` cube north face (14x14 px on the model) | the whole eye picture |
| 64 64 32 32 | 128 128 64 64 | `iris` cube north face (9x9 px, sits 0.5 px in front of the eye) | the centre 82/128 of the same eye picture (iris and pupil) |
| 112 112 16 16 | 224 224 32 32 | side, top, bottom and back faces of the eye and iris cubes | body colour |
| everything else | | unused | body tiling |

Three variants share the layout: `watcher_open` (eye property `open`), `watcher_closed` (`closed`, the iris bone is
hidden), `watcher_red` (`red`, during the hunt). The render controller picks the texture from the `given_jar:eye`
entity property.

The iris crop must line up with the eye picture: both come from the same image, centred on the pupil, so a small
iris offset (animation `iris`, at most 0.4 px) reads as the eye looking around. If a new eye picture has a different
iris size, change `IRIS_CROP` in scripts/make_textures.py (source pixels the 9x9 iris cube covers out of 128).

## Glow

The eye and iris use the vanilla material `entity_emissive_alpha`; the body uses `entity_alphatest`. With
`entity_emissive_alpha` the alpha channel is not transparency: lower alpha means the pixel glows more in the dark.
make_textures.py sets the eye regions' alpha to 150 (open), 100 (red, glows most) and 225 (closed). This reading of
the material is from community knowledge and has not been confirmed in game yet; see PLAYTEST.md.

## Model facts

- The sphere is 32 px (2 blocks) across, centred 19 px above the entity's feet (CONFIG.eyeHeight = 1.2 blocks).
- The model faces -Z (north), Bedrock's front. The eye cube is on the front surface.
- Bones: `root` (look-at rotation and bob) > `body`, `eye` > `iris`.
- Animations: `look` (head follows the nearest player), `bob` (slow, faster while hunting), `iris` (small wander).

## HUD numbers to tune in game

`resource_pack/ui/hud_screen.json`: the centre picture is 48x48 and drops 70 px after 1.5 s; the item picture that
stays is 20x20 at 88 px above the bottom edge. Screen sizes differ, so check these on the target PC (PLAYTEST.md).
