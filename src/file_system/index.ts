import { dirname, walk } from "../../deps.ts";

import {
  bumpVersion,
  getPackageXmlVersion,
  getSetupPyVersion,
  getVersionFromString,
  getVersionString,
  setPackageXmlVersion,
  setSetupPyVersion,
} from "../update_package/index.ts";
import type { BumpType, Version } from "../update_package/types.ts";

export async function getPathsToFiles(path: string, match: RegExp[]) {
  const paths: string[] = [];
  for await (
    const entry of walk(path, { match: match })
  ) {
    paths.push(entry.path);
  }
  return paths;
}

export function getPathToFileDirectory() {
  return new URL(dirname(import.meta.url)).pathname;
}

export async function getFileVersion(path: string) {
  const fileText = await Deno.readTextFile(path);
  if (path.endsWith(".xml")) {
    return getPackageXmlVersion(fileText);
  } else if (path.endsWith(".py")) {
    return getSetupPyVersion(fileText);
  } else {
    throw new Error(`Unknown file type: ${path}`);
  }
}

export async function setFileVersion(path: string, version: Version) {
  const fileText = await Deno.readTextFile(path);
  let newFileText;
  if (path.endsWith(".xml")) {
    newFileText = setPackageXmlVersion(fileText, version);
  } else if (path.endsWith(".py")) {
    newFileText = setSetupPyVersion(fileText, version);
  } else {
    throw new Error(`Unknown file type: ${path}`);
  }
  await Deno.writeTextFile(path, newFileText);
}

export async function bumpFileVersion(path: string, bumpType: BumpType) {
  const currentVersion = await getFileVersion(path);
  const newVersion = bumpVersion(currentVersion, bumpType);
  await setFileVersion(path, newVersion);
}

export async function bumpFiles(directory: string, bumpType: BumpType) {
  for (const file of await getFilePaths(directory)) {
    await bumpFileVersion(file, bumpType);
  }
}

export async function setFiles(directory: string, version: Version) {
  for (const file of await getFilePaths(directory)) {
    await setFileVersion(file, version);
  }
}

export async function getVersion(directory: string): Promise<Version> {
  const versionSet = new Set<string>();
  for (const file of await getFilePaths(directory)) {
    versionSet.add(getVersionString(await getFileVersion(file)));
  }
  if (versionSet.size !== 1) {
    throw new Error(
      `Version is not consistent - got the following versions: ${
        [...versionSet.keys()].join(", ")
      }`,
    );
  }
  return getVersionFromString(versionSet.values().next().value);
}

export async function getFilePaths(directory: string) {
  return await getPathsToFiles(directory, [/package.xml$/, /setup.py$/]);
}
