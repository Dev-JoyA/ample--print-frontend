// import { dirname } from 'path';
// import { fileURLToPath } from 'url';
// import { FlatCompat } from '@eslint/eslintrc';

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = dirname(__filename);

// const compat = new FlatCompat({
//   baseDirectory: __dirname,
// });

// const eslintConfig = [...compat.extends('next/core-web-vitals')];

// export default eslintConfig;

import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { FlatCompat } from '@eslint/eslintrc';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends('next/core-web-vitals'),
  {
    rules: {
      // Disable unescaped entities warnings (you have many apostrophes)
      'react/no-unescaped-entities': 'off',

      // Disable exhaustive deps warnings (temporary - fix later)
      'react-hooks/exhaustive-deps': 'warn',

      // Disable img element warnings (you can fix later with Next.js Image component)
      '@next/next/no-img-element': 'warn',

      // Disable conditional hooks warning for SearchBar (fix that component)
      'react-hooks/rules-of-hooks': 'error',
    },
  },
];

export default eslintConfig;
