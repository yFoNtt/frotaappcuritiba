import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist", "node_modules", "supabase/functions/_shared/**", "supabase/functions/mcp/**"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      "@typescript-eslint/no-unused-vars": "off",
      // Pragmatic relaxations: pervasive low-risk patterns (catch blocks, Excel
      // export rows, lazy-route fallbacks, Supabase generated rows). Tightening
      // these would require touching ~60 files with no runtime benefit.
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-empty-object-type": "off",
      "no-async-promise-executor": "off",
    },
  },
  // shadcn/ui primitives intentionally co-export variants/constants alongside
  // components; Fast Refresh nag is noise here.
  {
    files: [
      "src/components/ui/**/*.{ts,tsx}",
      "src/hooks/useAuth.tsx",
      "src/components/inspections/InspectionChecklist.tsx",
    ],
    rules: {
      "react-refresh/only-export-components": "off",
    },
  },
  // Edge Functions sanitize user input by stripping control chars by design.
  {
    files: ["supabase/functions/**/*.ts"],
    rules: {
      "no-control-regex": "off",
    },
  },
  // Tailwind config uses CommonJS `require` for plugin loading (Tailwind v3 norm).
  {
    files: ["tailwind.config.ts"],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
    },
  },
);
