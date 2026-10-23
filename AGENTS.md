<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->
- Video processing runs in the browser with ffmpeg.wasm (src/lib/hype-processor.ts, loaded dynamically); the ranking algorithm in src/lib/hype-engine.ts is a port of the user's hype_finder.py. Why: the hosting runs on edge workers, which cannot run Python or native FFmpeg.
