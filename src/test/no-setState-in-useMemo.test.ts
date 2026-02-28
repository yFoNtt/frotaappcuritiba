import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

/**
 * Regression test: ensures no component calls setState inside useMemo.
 * This is a React anti-pattern that causes "Cannot update a component
 * while rendering a different component" errors.
 */

function getAllTsxFiles(dir: string): string[] {
  const results: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory() && entry.name !== "node_modules" && entry.name !== "ui") {
      results.push(...getAllTsxFiles(fullPath));
    } else if (entry.name.endsWith(".tsx") || entry.name.endsWith(".ts")) {
      if (!entry.name.endsWith(".test.ts") && !entry.name.endsWith(".test.tsx")) {
        results.push(fullPath);
      }
    }
  }
  return results;
}

describe("React anti-pattern: setState inside useMemo", () => {
  const srcDir = path.resolve(__dirname, "..");
  const files = getAllTsxFiles(srcDir);

  it("should have found source files to scan", () => {
    expect(files.length).toBeGreaterThan(0);
  });

  it("should not call any setState function inside useMemo", () => {
    const violations: string[] = [];
    // Match useMemo(() => { ... }) blocks that contain set[A-Z] calls
    const useMemoRegex = /useMemo\(\s*\(\)\s*=>\s*\{([\s\S]*?)\}\s*,/g;
    const setStateRegex = /\bset[A-Z]\w+\s*\(/;

    for (const filePath of files) {
      const content = fs.readFileSync(filePath, "utf-8");
      let match: RegExpExecArray | null;

      // Reset regex lastIndex
      useMemoRegex.lastIndex = 0;
      while ((match = useMemoRegex.exec(content)) !== null) {
        const body = match[1];
        if (setStateRegex.test(body)) {
          const relativePath = path.relative(srcDir, filePath);
          const lineNumber = content.substring(0, match.index).split("\n").length;
          violations.push(`${relativePath}:${lineNumber}`);
        }
      }
    }

    if (violations.length > 0) {
      throw new Error(
        `Found setState calls inside useMemo (React anti-pattern):\n` +
          violations.map((v) => `  - ${v}`).join("\n") +
          `\n\nMove setState calls to useEffect or event handlers instead.`
      );
    }
  });
});
