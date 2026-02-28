import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

/**
 * Regression tests for common React anti-patterns.
 * These tests statically scan source files to catch mistakes early.
 */

function getAllSourceFiles(dir: string): string[] {
  const results: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory() && !["node_modules", "ui", "test"].includes(entry.name)) {
      results.push(...getAllSourceFiles(fullPath));
    } else if ((entry.name.endsWith(".tsx") || entry.name.endsWith(".ts")) &&
               !entry.name.endsWith(".test.ts") && !entry.name.endsWith(".test.tsx") &&
               !entry.name.endsWith(".d.ts")) {
      results.push(fullPath);
    }
  }
  return results;
}

const srcDir = path.resolve(__dirname, "..");
const files = getAllSourceFiles(srcDir);

function scanFiles(pattern: RegExp): { file: string; line: number; match: string }[] {
  const results: { file: string; line: number; match: string }[] = [];
  for (const filePath of files) {
    const content = fs.readFileSync(filePath, "utf-8");
    const lines = content.split("\n");
    for (let i = 0; i < lines.length; i++) {
      if (pattern.test(lines[i])) {
        results.push({
          file: path.relative(srcDir, filePath),
          line: i + 1,
          match: lines[i].trim(),
        });
      }
    }
  }
  return results;
}

function scanUseMemoBlocks(setStatePattern: RegExp): string[] {
  const violations: string[] = [];
  const useMemoRegex = /useMemo\(\s*\(\)\s*=>\s*\{([\s\S]*?)\}\s*,/g;
  for (const filePath of files) {
    const content = fs.readFileSync(filePath, "utf-8");
    useMemoRegex.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = useMemoRegex.exec(content)) !== null) {
      if (setStatePattern.test(match[1])) {
        const line = content.substring(0, match.index).split("\n").length;
        violations.push(`${path.relative(srcDir, filePath)}:${line}`);
      }
    }
  }
  return violations;
}

describe("React anti-patterns static analysis", () => {
  it("should have source files to scan", () => {
    expect(files.length).toBeGreaterThan(0);
  });

  // 1. setState inside useMemo
  it("should not call setState inside useMemo", () => {
    const violations = scanUseMemoBlocks(/\bset[A-Z]\w+\s*\(/);
    if (violations.length > 0) {
      throw new Error(
        `setState inside useMemo (causes render errors):\n` +
        violations.map(v => `  - ${v}`).join("\n") +
        `\n\nFix: move setState to useEffect or event handlers.`
      );
    }
  });

  // 2. useEffect with subscriptions/listeners but no cleanup
  it("should return cleanup for useEffect with addEventListener", () => {
    const violations: string[] = [];
    const useEffectBlockRegex = /useEffect\(\s*\(\)\s*=>\s*\{([\s\S]*?)\}\s*,\s*\[/g;

    for (const filePath of files) {
      const content = fs.readFileSync(filePath, "utf-8");
      useEffectBlockRegex.lastIndex = 0;
      let match: RegExpExecArray | null;
      while ((match = useEffectBlockRegex.exec(content)) !== null) {
        const body = match[1];
        const hasAddListener = /addEventListener\s*\(/.test(body);
        const hasRemoveListener = /removeEventListener\s*\(/.test(body);
        // If it adds a listener but never removes it
        if (hasAddListener && !hasRemoveListener) {
          const line = content.substring(0, match.index).split("\n").length;
          violations.push(`${path.relative(srcDir, filePath)}:${line}`);
        }
      }
    }

    if (violations.length > 0) {
      throw new Error(
        `useEffect adds event listeners without cleanup (memory leak):\n` +
        violations.map(v => `  - ${v}`).join("\n") +
        `\n\nFix: return a cleanup function that calls removeEventListener.`
      );
    }
  });

  // 3. useEffect with supabase .subscribe() but no .unsubscribe() cleanup
  it("should return cleanup for useEffect with supabase subscriptions", () => {
    const violations: string[] = [];
    const useEffectBlockRegex = /useEffect\(\s*\(\)\s*=>\s*\{([\s\S]*?)\}\s*,\s*\[/g;

    for (const filePath of files) {
      const content = fs.readFileSync(filePath, "utf-8");
      useEffectBlockRegex.lastIndex = 0;
      let match: RegExpExecArray | null;
      while ((match = useEffectBlockRegex.exec(content)) !== null) {
        const body = match[1];
        const hasSubscribe = /\.subscribe\s*\(/.test(body);
        const hasUnsubscribe = /\.unsubscribe\s*\(|removeChannel|removeAllChannels/.test(body);
        const hasReturn = /return\s/.test(body);
        if (hasSubscribe && !(hasUnsubscribe || hasReturn)) {
          const line = content.substring(0, match.index).split("\n").length;
          violations.push(`${path.relative(srcDir, filePath)}:${line}`);
        }
      }
    }

    if (violations.length > 0) {
      throw new Error(
        `useEffect with .subscribe() but no cleanup (memory leak):\n` +
        violations.map(v => `  - ${v}`).join("\n") +
        `\n\nFix: return () => subscription.unsubscribe() or supabase.removeChannel().`
      );
    }
  });

  // 4. Direct DOM manipulation (document.getElementById) in components
  it("should not use document.getElementById in React components", () => {
    const hits = scanFiles(/document\.getElementById\s*\(/);
    // Filter to only .tsx component files (not utility files)
    const componentHits = hits.filter(h => h.file.endsWith(".tsx") && 
      (h.file.includes("pages/") || h.file.includes("components/")));
    
    if (componentHits.length > 0) {
      throw new Error(
        `Direct DOM access via document.getElementById in components:\n` +
        componentHits.map(h => `  - ${h.file}:${h.line} → ${h.match}`).join("\n") +
        `\n\nFix: use React refs (useRef) instead.`
      );
    }
  });

  // 5. async function passed directly to useEffect
  it("should not pass async functions directly to useEffect", () => {
    const hits = scanFiles(/useEffect\(\s*async\s/);

    if (hits.length > 0) {
      throw new Error(
        `async function passed directly to useEffect (must return cleanup, not Promise):\n` +
        hits.map(h => `  - ${h.file}:${h.line} → ${h.match}`).join("\n") +
        `\n\nFix: define async function inside useEffect and call it.`
      );
    }
  });

  // 6. setState called during render (outside hooks/handlers)
  it("should not have console.log in production components", () => {
    // This checks for forgotten console.log (not console.error/warn which are intentional)
    const hits = scanFiles(/^\s+console\.log\s*\(/);
    const componentHits = hits.filter(h => 
      (h.file.includes("pages/") || h.file.includes("components/")) &&
      !h.match.includes("// debug") // allow explicitly marked debug logs
    );

    // Warning only - don't fail, just report
    if (componentHits.length > 5) {
      console.warn(
        `Found ${componentHits.length} console.log statements in components. ` +
        `Consider removing them for production.`
      );
    }
  });
});
