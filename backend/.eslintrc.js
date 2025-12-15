module.exports = {
    // Tells ESLint how to parse the code (especially for TypeScript)
    parser: '@typescript-eslint/parser',
    
    // Extends a set of rules and configurations
    extends: [
        // Use the recommended rules for ESLint and TypeScript
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended',
        // Turns off all ESLint rules that are unnecessary or conflict with Prettier
        'plugin:prettier/recommended' 
    ],
    
    // Additional rules (optional)
    rules: {
        // You can override rules here, e.g., to enforce a specific rule
        // 'no-console': 'warn', 
    },
    
    // Environment settings (e.g., enable global variables for browser or Node)
    env: {
        browser: true,
        node: true,
        es2020: true
    }
};