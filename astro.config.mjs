// @ts-check
import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import starlight from "@astrojs/starlight";

// https://astro.build/config
export default defineConfig({
  integrations: [
    starlight({
      title: "DashGL Formats",
      social: {
        github: "https://github.com/DashGL/FormatDocs",
      },
      sidebar: [
        {
          label: "MegaMan Legends 2",
          // Autogenerate a group of links for the 'constellations' directory.
          autogenerate: { directory: "mml2" },
        },
        {
          label: "Guides",
          items: [
            // Each item here is one entry in the navigation menu.
            { label: "Example Guide", slug: "guides/example" },
          ],
        },
        {
          label: "Reference",
          autogenerate: { directory: "reference" },
        },
      ],
    }),
    mdx(),
  ],
});
