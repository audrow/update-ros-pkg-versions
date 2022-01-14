import { basename, dirname, walk } from "../../deps.ts";

import {
  bumpVersion,
  getPackageXmlVersion,
  getSetupPyVersion,
  getVersionFromString,
  getVersionString,
  isRos1File,
  setChangeLogVersion,
  setPackageXmlVersion,
  setSetupPyVersion,
} from "../update_package/index.ts";
import type { BumpType, Version } from "../update_package/types.ts";
import type { Status } from "./types.ts";

export async function getPathsToRos2Files(path: string, match: RegExp[]) {
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
  if (isRos1File(fileText)) {
    throw new Error(`Cannot set version for ROS 1 file: ${path}`);
  } else if (fileName === "package.xml") {
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
  if (isRos1File(fileText)) {
    throw new Error(`Cannot set version for ROS 1 file: ${path}`);
  } else if (fileName === "package.xml") {
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

export async function bumpFileVersion(
  path: string,
  bumpType: BumpType,
  isStopOnError = true,
) {
  const currentVersion = await getFileVersion(path);
  const newVersion = bumpVersion(currentVersion, bumpType);
  return await tryToSetFileVersion(path, newVersion, {
    isStopOnError: isStopOnError,
  });
}

export async function bumpFiles(
  directory: string,
  bumpType: BumpType,
  isSkipSetupPy = false,
  isStopOnError = false,
) {
  const { version } = await getVersion(directory, isSkipSetupPy);
  const newVersion = bumpVersion(version, bumpType);
  return await setFiles(directory, newVersion, isSkipSetupPy, isStopOnError);
}

export async function setFiles(
  directory: string,
  version: Version,
  isSkipSetupPy = false,
  isStopOnError = false,
) {
  const fileStatuses: Status[] = [];
  for (
    const file of await getRos2FilePaths(directory, {
      isIncludeChangeLog: true,
      isSkipSetupPy: isSkipSetupPy,
    })
  ) {
    fileStatuses.push(
      await tryToSetFileVersion(file, version, {
        isStopOnError: isStopOnError,
      }),
    );
  }
  return fileStatuses;
}

async function tryToSetFileVersion(
  file: string,
  version: Version,
  options: { isStopOnError: boolean } = { isStopOnError: false },
): Promise<Status> {
  try {
    await setFileVersion(file, version);
    return { isSuccess: true, file };
  } catch (error) {
    if (options.isStopOnError) {
      throw new Error(`Failed to set version for ${file}: ${error}`);
    } else {
      return { isSuccess: false, file, message: error.message };
    }
  }
}

export async function getVersion(
  directory: string,
  isSkipSetupPy = false,
  options: { isStopOnError: boolean } = { isStopOnError: false },
) {
  const versionSet = new Set<string>();
  const fileStatuses: Status[] = [];
  for (
    const file of await getRos2FilePaths(directory, {
      isIncludeChangeLog: false,
      isSkipSetupPy,
    })
  ) {
    let version: Version;
    try {
      version = await getFileVersion(file);
      versionSet.add(getVersionString(version));
      fileStatuses.push({ isSuccess: true, file });
    } catch (error) {
      if (options.isStopOnError) {
        throw new Error(`Failed to get version for ${file}: ${error}`);
      } else {
        fileStatuses.push({ isSuccess: false, file, message: error.message });
      }
    }
  }
  if (versionSet.size < 1) {
    throw new Error(`No version found in ${directory}`);
  } else if (versionSet.size > 1) {
    throw new Error(
      `Version is not consistent - got the following versions: ${
        [...versionSet.keys()].join(", ")
      }`,
    );
  }
  return {
    version: getVersionFromString(versionSet.values().next().value),
    statuses: fileStatuses,
  };
}

export async function getRos2FilePaths(
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
  return await getPathsToRos2Files(directory, matches);
}
