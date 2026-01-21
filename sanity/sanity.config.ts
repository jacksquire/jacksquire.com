import { defineConfig } from 'sanity';
import { structureTool } from 'sanity/structure';
import { visionTool } from '@sanity/vision';
import { codeInput } from '@sanity/code-input';
import { schemaTypes } from './schemas';

export default defineConfig({
  name: 'default',
  title: 'Jack Squire Blog',

  projectId: 'n7i175k4',
  dataset: 'production',

  plugins: [
    structureTool(),
    visionTool(),
    codeInput(),
  ],

  schema: {
    types: schemaTypes,
  },

  studio: {
    components: {
      // Custom studio components can go here
    },
  },
});
