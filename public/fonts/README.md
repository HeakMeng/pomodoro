# Fonts

This folder is a placeholder for a local **Hornset** font. The project is currently using **Oswald** from Google Fonts as a visual fallback with the same `--font-hornset` CSS variable.

## To swap in a real Hornset file

1. Drop `Hornset.woff2` (and optionally weight variants like `Hornset-Bold.woff2`) into this folder.
2. In `app/layout.tsx`, replace the `next/font/google` import for Oswald with `next/font/local`:

   ```ts
   import localFont from "next/font/local";

   const hornset = localFont({
     src: [
       { path: "../public/fonts/Hornset.woff2", weight: "400", style: "normal" },
       { path: "../public/fonts/Hornset-Bold.woff2", weight: "700", style: "normal" },
     ],
     variable: "--font-hornset",
     display: "swap",
   });
   ```

3. Remove the Oswald import. Everything else (`font-sans`, timer typography) picks up the change automatically via the `--font-hornset` CSS variable.
