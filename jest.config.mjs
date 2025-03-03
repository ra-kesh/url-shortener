export default {
  // Set the test environment
  testEnvironment: 'node',
  
  // Tell Jest to treat .js files as ESM
  extensionsToTreatAsEsm: [],
  
  // Don't transform anything - use native ESM
  transform: {},
  
  // Indicate that we're using native ESM
  moduleNameMapper: {
    // Handle ESM module imports
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  
  // Node.js's experimental ESM support requires file extensions
  // but Jest's moduleNameMapper can't handle dynamic imports
  
  // Handle ESM and CommonJS interoperability
  transformIgnorePatterns: [
    '/node_modules/(?!.*\\.mjs$)'
  ],
  
  // Set a verbose reporter for detailed output
  verbose: true,
};

