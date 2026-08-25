const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const outputRoot = path.join(root, "outputs");
const entryPath = path.join(outputRoot, "montenotte-prototype.html");
const html = fs.readFileSync(entryPath, "utf8");

const scriptPaths = [...html.matchAll(/<script src="([^"]+)"/g)].map(match => match[1]);
if (!scriptPaths.length) throw new Error("No external scripts found in the prototype entry page.");

const source = scriptPaths
  .map(relativePath => fs.readFileSync(path.join(outputRoot, relativePath), "utf8"))
  .join("\n");

new Function(source);

for (const match of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
  const relativePath = match[1];
  if (/^(?:https?:|#)/.test(relativePath)) continue;
  const assetPath = path.join(outputRoot, relativePath);
  if (!fs.existsSync(assetPath)) throw new Error(`Missing linked asset: ${relativePath}`);
}

const rootEntry = fs.readFileSync(path.join(root, "index.html"), "utf8");
const redirect = rootEntry.match(/url=([^"'>]+)/i)?.[1];
if (redirect && !fs.existsSync(path.join(root, redirect))) {
  throw new Error(`Missing root redirect target: ${redirect}`);
}

console.log(`Static check passed: ${scriptPaths.length} scripts and all linked assets are valid.`);
