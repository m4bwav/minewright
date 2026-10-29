# given.jar art: prompts and settings

Generated 2026-10-27 with ComfyUI. No third-party art. Full ComfyUI API graphs are in workflows/. This folder keeps
only what the packs use (eye_*_128.png, body_64.png, icon.png; the 0.1.0 versions of eye_open, eye_red and icon are in
base/, and scripts/bloodshot.py paints the 0.1.1 veins and red pupil onto them, see ../ART.md); the 1024 px sources, hero and splash are not here.
scripts/make_textures.py turns these into the pack textures (layout: ../ART.md).

Z-Image Turbo graph (zimage): UNETLoader z_image_turbo_bf16 + CLIPLoader qwen_3_4b (type lumina2) + VAE ae,
  KSampler 9 steps, cfg 1.0, res_multistep / simple, denoise 1.0, empty negative.
FLUX.2 Klein edit graph (klein): UNETLoader flux-2-klein-4b (distilled) + CLIPLoader qwen_3_4b (type flux2) + VAE flux2-vae,
  LoadImage -> ImageScaleToTotalPixels 1.0 MP lanczos -> VAEEncode -> ReferenceLatent on positive and empty negative,
  CFGGuider cfg 1.0, euler, Flux2Scheduler 4 steps, EmptyFlux2LatentImage 1024x1024.

------------------------------------------------------------------
eye_open_src.png  (+ eye_open_64.png, eye_open_128.png)
  workflow: zimage, workflows/eye_open_src.workflow.json, 1024x1024, seed 7106
  prompt: Extreme close-up macro photograph of one single human eye, seen straight on from the front, filling the whole square
    frame from edge to edge. The round hazel-green iris with fine radial fibres and the black pupil sit exactly in the centre of
    the frame. Wide open eyelids with dark lashes along the top and bottom edges. Glossy wet white sclera with faint thin red veins.
    One small bright wet specular highlight on the cornea. Low-key lighting: only the eyeball is lit, the eyelids and corners fade
    into near-black shadow. Sharp focus, realistic
  post: square crop (r=480) centred on the detected pupil, Lanczos to 1024 = eye_open_src.png.
    64/128: 820 px square around the pupil, radial vignette on the corners, Lanczos down, UnsharpMask r1 (70% at 64, 50% at 128).
  rejected: seeds 7101-7105, 7107 (iris off centre or bright skin around the eye).

eye_red_src.png  (+ eye_red_64.png, eye_red_128.png)
  workflow: klein edit of eye_open_src.png, workflows/eye_red_src.workflow.json, seed 8101
  prompt: Change only the colour of the iris in image 1: make the iris a glowing blood-red iris that shines with red light, and add
    more thin red veins across the white of the eye so it looks menacing. Keep the eye's shape, size and position, the black pupil,
    the wet highlight, the eyelids, lashes, skin, framing and lighting exactly as in image 1. A real macro photograph, sharp focus.
  post: shifted so its pupil sits on the open eye's pupil, then the same 64/128 steps as eye_open.
  rejected: seed 8102 (red glow bleeding onto the upper lid), 8103 (red smear on the lower lid that read as blood).

eye_closed_64.png  (+ eye_closed_128.png)
  workflow: klein edit of eye_open_src.png, workflows/eye_closed_src.workflow.json, seed 8201
  prompt: Close the eye in image 1: the upper eyelid is lowered all the way down and rests on the lower eyelid, the eye is fully
    shut with no eyeball, iris or white visible, only a smooth curved closed eyelid with a line of dark lashes along the closed seam.
    Keep the framing, the skin, the lashes, the deep shadows and the low-key lighting exactly as in image 1. A real macro photograph,
    sharp focus.
  post: brightness x0.55, 18% blend toward dark violet (40,20,60), then the same crop/vignette/downscale as eye_open.
  rejected: seed 8202 (two rows of lashes).

body_64.png
  workflow: zimage, workflows/body_plate.workflow.json, 1024x1024, seed 7303
  prompt: Close-up flat texture of dark purple-black obsidian volcanic glass filling the whole frame, deep void black with many small
    faint violet and purple glints scattered evenly across it like tiny specks of dust, a subtle dark violet sheen, even soft light,
    seen straight from above, uniform all over
  post (plate, not picture): trim 1/16 margin, 512 px, made seamless by cross-fading with a half-offset copy under a sine window,
    flattened to near-black (13,9,20) plus 35% of the plate's detail, top 3% brightest points kept as purple (150,80,210) speckles,
    box-downscaled to 64x64. Tiles without seams.
  rejected: seed 7301 (almost no speckles), 7302 (dark blotches).

hero.png  1280x640
  workflow: zimage, workflows/hero.workflow.json, 1280x640, seed 7407 (used as rendered, no post)
  prompt: Wide cinematic landscape built entirely from cubic voxel blocks in a blocky sandbox video game style: rolling square
    grass-topped hills, blocky trees with cube leaves, a calm lake of square water blocks, at dusk with a smooth deep purple to orange
    sky and the first stars. In the right third of the picture a large smooth matte black sphere floats in the air above the hills.
    On the front of the sphere is one single photorealistic human eye: glossy wet white sclera with thin red veins, a detailed
    hazel-green iris, black pupil, a small wet highlight. A thin soft violet rim light outlines the edge of the sphere. The left half
    of the sky is open, calm and smooth gradient. Moody, mysterious, gentle, kid-friendly
  rejected: 7401-7402 (cartoon eye), 7403 (purple streak artifact on the sphere), 7404 (odd shadow), 7405-7406, 7408.

splash.png  1920x1080
  workflow: zimage, workflows/splash.workflow.json, 1920x1088 (latent must be a multiple of 16), seed 7507
  prompt: same as hero.png
  post: 4 px cropped from top and bottom to 1920x1080.
  rejected: 7501-7502 (cartoon eye), 7503 (sphere centred), 7504 (dark streak in the sky, scratch on the eye), 7505-7506.

icon.png  512x512
  workflow: zimage, workflows/icon.workflow.json, 1024x1024, seed 7202
  prompt: A smooth glossy black sphere floating in the centre of the frame, one single large realistic human eye on its front with a
    bright green iris looking at the viewer, faint purple rim light around the sphere, deep dark purple gradient backdrop, bold simple
    silhouette, centered, polished 3D render, mysterious and friendly
  post: 668 px square crop centred on the sphere (510,544), Lanczos to 512, UnsharpMask r1 40%. Reads clearly at 64 px.
  rejected: seed 7201 (smaller, dimmer sphere).

Licences: Z-Image Turbo (Tongyi-MAI) and FLUX.2 Klein 4B are Apache 2.0 with commercial use of outputs; re-check before shipping.
