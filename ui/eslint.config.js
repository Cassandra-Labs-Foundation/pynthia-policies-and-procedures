// eslint.config.js
//
// CommonJS, because ui/package.json declares no "type": "module". That matters
// here: the previous version derived __dirname the ESM way, from a
// `const __filename` that referenced itself in its own initializer. It threw on
// load, so `next build` reported "ESLint: require is not defined in ES module
// scope" and carried on without linting anything — a silent no-op rather than a
// failure. In CJS __dirname is already in scope and none of that is needed.
const { FlatCompat } = require("@eslint/eslintrc");

const compat = new FlatCompat({ baseDirectory: __dirname });

module.exports = [...compat.extends("next/core-web-vitals")];
