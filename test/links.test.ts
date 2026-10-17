import { expect } from "chai";
import * as fs from "fs";
import * as path from "path";

describe("Link and Script Integrity", () => {
  const rootDir = process.cwd();

  it("ensures every npm script target file exists on disk", () => {
    const pkgPath = path.join(rootDir, "package.json");
    const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
    const scripts = pkg.scripts || {};

    const missingScripts: string[] = [];
    for (const [name, cmd] of Object.entries<string>(scripts)) {
      // Find all file paths ending in .ts or .js mentioned in the command
      const matches = cmd.match(/[a-zA-Z0-9_\-\/]+\.(ts|js)/g);
      if (matches) {
        for (const filePath of matches) {
          const absPath = path.resolve(rootDir, filePath);
          if (!fs.existsSync(absPath)) {
            missingScripts.push(`Script '${name}' references missing file: ${filePath}`);
          }
        }
      }
    }

    expect(missingScripts).to.deep.equal([], missingScripts.join("\n"));
  });

  it("ensures all relative links in README.md resolve to existing files", () => {
    const readmePath = path.join(rootDir, "README.md");
    const content = fs.readFileSync(readmePath, "utf-8");

    // Match markdown links [text](path)
    const linkRegex = /\[[^\]]+\]\(([^)]+)\)/g;
    let match;
    const missingLinks: string[] = [];

    while ((match = linkRegex.exec(content)) !== null) {
      let target = match[1].trim();

      // Skip external links, fragments, or anchors
      if (
        target.startsWith("http://") ||
        target.startsWith("https://") ||
        target.startsWith("#") ||
        target.startsWith("mailto:")
      ) {
        continue;
      }

      // Remove anchor fragments within target
      const [cleanTarget] = target.split("#");
      if (!cleanTarget) continue;

      const resolved = path.resolve(rootDir, cleanTarget);
      if (!fs.existsSync(resolved)) {
        missingLinks.push(`README.md link to '${target}' cannot be resolved at ${resolved}`);
      }
    }

    expect(missingLinks).to.deep.equal([], missingLinks.join("\n"));
  });

  it("ensures all relative links in docs/ resolve to existing files", () => {
    const docsDir = path.join(rootDir, "docs");

    function getMdFiles(dir: string): string[] {
      const results: string[] = [];
      const list = fs.readdirSync(dir);
      for (const item of list) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
          results.push(...getMdFiles(fullPath));
        } else if (item.endsWith(".md")) {
          results.push(fullPath);
        }
      }
      return results;
    }

    const mdFiles = getMdFiles(docsDir);
    const linkRegex = /\[[^\]]+\]\(([^)]+)\)/g;
    const brokenLinks: string[] = [];

    for (const file of mdFiles) {
      const content = fs.readFileSync(file, "utf-8");
      let match;
      while ((match = linkRegex.exec(content)) !== null) {
        let target = match[1].trim();
        if (
          target.startsWith("http://") ||
          target.startsWith("https://") ||
          target.startsWith("#") ||
          target.startsWith("mailto:")
        ) {
          continue;
        }

        if (target.startsWith("file://")) {
          const filePath = target.replace(/^file:\/\//, "").split("#")[0];
          if (!fs.existsSync(filePath)) {
            brokenLinks.push(`${path.relative(rootDir, file)} links to broken target: ${target}`);
          }
          continue;
        }

        const [cleanTarget] = target.split("#");
        if (!cleanTarget) continue;

        // Resolve relative to the markdown file's directory
        const resolved = path.resolve(path.dirname(file), cleanTarget);
        if (!fs.existsSync(resolved)) {
          // Check if resolved relative to root
          const resolvedRoot = path.resolve(rootDir, cleanTarget);
          if (!fs.existsSync(resolvedRoot)) {
            brokenLinks.push(`${path.relative(rootDir, file)} links to broken target: ${target}`);
          }
        }
      }
    }

    expect(brokenLinks).to.deep.equal([], brokenLinks.join("\n"));
  });
});
