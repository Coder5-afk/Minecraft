import { execFileSync } from "node:child_process";
import { mkdirSync, existsSync, rmSync } from "node:fs";

function requireZip() {
  try {
    execFileSync("which", ["zip"]);
  } catch {
    console.error("package-addon: the `zip` CLI is required but was not found on PATH");
    process.exit(1);
  }
}

function zipDirContents(sourceDir, outputAbsPath) {
  if (existsSync(outputAbsPath)) rmSync(outputAbsPath);
  execFileSync("zip", ["-r", outputAbsPath, "."], { cwd: sourceDir });
}

function main() {
  requireZip();
  mkdirSync("dist", { recursive: true });

  const behaviorPackZip = `${process.cwd()}/dist/african-trees-behavior.mcpack`;
  const resourcePackZip = `${process.cwd()}/dist/african-trees-resource.mcpack`;
  const addonZip = `${process.cwd()}/dist/african-trees.mcaddon`;

  zipDirContents("behavior_pack", behaviorPackZip);
  zipDirContents("resource_pack", resourcePackZip);

  if (existsSync(addonZip)) rmSync(addonZip);
  execFileSync("zip", ["-j", addonZip, behaviorPackZip, resourcePackZip]);

  console.log(`package-addon: wrote ${addonZip}`);
}

main();
