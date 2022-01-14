import { basename, dirname, walk } from "../../deps.ts";

import {
  bumpVersion,
  getPackageXmlVersion,
  getSetupPyVersion,
  getVersionFromString,
  getVersionString,
  setChangeLogVersion,
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
  const fileName = basename(path);
  if (fileName === "package.xml") {
    return getPackageXmlVersion(fileText);
  } else if (fileName === "setup.py") {
    return getSetupPyVersion(fileText);
  } else if (fileName === "CHANGELOG.rst") {
    throw new Error(`Cannot get version from CHANGELOG.rst: ${path}`);
  } else {
    throw new Error(`Unknown file type: ${path}`);
  }
}

export async function setFileVersion(path: string, version: Version) {
  const fileText = await Deno.readTextFile(path);
  const fileName = basename(path);
  let newFileText;
  if (fileName === "package.xml") {
    newFileText = setPackageXmlVersion(fileText, version);
  } else if (fileName === "setup.py") {
    newFileText = setSetupPyVersion(fileText, version);
  } else if (fileName === "CHANGELOG.rst") {
    newFileText = setChangeLogVersion(fileText, version);
  } else {
    throw new Error(`Unknown file type: ${path}`);
  }
  await Deno.writeTextFile(path, newFileText);
}

export async function bumpFileVersion(path: string, bumpType: BumpType) {
  const currentVersion = await getFileVersion(path);
  const newVersion = bumpVersion(currentVersion, bumpType);
  try {
    await setFileVersion(path, newVersion);
  } catch (error) {
    throw new Error(`Failed to set version for ${path}: ${error}`);
  }
}

export async function bumpFiles(
  directory: string,
  bumpType: BumpType,
  isSkipSetupPy = false,
) {
  const currentVersion = await getVersion(directory, isSkipSetupPy);
  const newVersion = bumpVersion(currentVersion, bumpType);
  for (
    const file of await getFilePaths(directory, {
      isIncludeChangeLog: true,
      isSkipSetupPy: isSkipSetupPy,
    })
  ) {
    try {
      await setFileVersion(file, newVersion);
    } catch (error) {
      throw new Error(`Failed to set version for ${file}: ${error}`);
    }
  }
}

export async function setFiles(
  directory: string,
  version: Version,
  isSkipSetupPy = false,
) {
  for (
    const file of await getFilePaths(directory, {
      isIncludeChangeLog: true,
      isSkipSetupPy: isSkipSetupPy,
    })
  ) {
    await setFileVersion(file, version);
  }
}

export async function getVersion(
  directory: string,
  isSkipSetupPy = false,
): Promise<Version> {
  const versionSet = new Set<string>();
  for (
    const file of await getFilePaths(directory, {
      isIncludeChangeLog: false,
      isSkipSetupPy: isSkipSetupPy,
    })
  ) {
    let version: Version;
    try {
      version = await getFileVersion(file);
    } catch (error) {
      throw new Error(`Failed to get version for ${file}: ${error}`);
    }
    versionSet.add(getVersionString(version));
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

export async function getFilePaths(
  directory: string,
  options: Partial<{
    isSkipSetupPy: boolean;
    isSkipPackageXml: boolean;
    isIncludeChangeLog: boolean;
  }>,
) {
  const matches: RegExp[] = [];
  if (!options.isSkipPackageXml) {
    matches.push(/\/package.xml$/);
  }
  if (!options.isSkipSetupPy) {
    matches.push(/\/setup.py$/);
  }
  if (options.isIncludeChangeLog) {
    matches.push(/\/CHANGELOG.rst$/);
  }
  return await getPathsToFiles(directory, matches);
}
