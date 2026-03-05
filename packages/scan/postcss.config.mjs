import atTailwind from '@tailwindcss/postcss';
import autoprefixer from 'autoprefixer';
import remToPx from './postcss.rem2px.mjs';

export default {
  plugins: [remToPx({ baseValue: 16 }), atTailwind, autoprefixer],
};
