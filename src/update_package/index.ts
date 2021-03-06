import { BumpType, Version } from "./types.ts";
import { format } from "../../deps.ts";

export function getPackageXmlVersion(text: string) {
  const regex = /<version>(.*)<\/version>/;
  return getVersionFromRegexMatch(text, regex);
}

export function isRos1File(text: string) {
  const regex = /catkin/;
  return !!text.match(regex);
}

export function getSetupPyVersion(text: string) {
  const regex = /version='(.*)'/;
  return getVersionFromRegexMatch(text, regex);
}

function getVersionFromRegexMatch(text: string, regex: RegExp) {
  const versionMatches = text.match(regex);
  if (!versionMatches) {
    throw new Error(`Could not find version in the following text:\n\n${text}`);
  }
  const version = versionMatches[1];
  return getVersionFromString(version);
}

export function setPackageXmlVersion(text: string, version: Version) {
  const regex = /(<version>)(.*)(<\/version>)/;
  return setVersionInText(text, regex, version);
}

export function setSetupPyVersion(text: string, version: Version) {
  const regex = /(version=')(.*)(')/;
  return setVersionInText(text, regex, version);
}

export function setChangeLogVersion(text: string, version: Version) {
  const regex = /Forthcoming\n-----------/;
  if (text.match(regex)) {
    const heading = `${getVersionString(version)} (${
      format(new Date(), "yyyy-MM-dd")
    })`;
    const replaceText = heading + "\n" + "-".repeat(heading.length);
    return text.replace(regex, replaceText);
  } else {
    throw new Error(`Could not set version in the following text:\n\n${text}`);
  }
}

function setVersionInText(text: string, regex: RegExp, version: Version) {
  if (text.match(regex)) {
    return text.replace(regex, `$1${getVersionString(version)}$3`);
  } else {
    throw new Error(`Could not set version in the following text:\n\n${text}`);
  }
}

export function getVersionFromString(text: string) {
  const versionNumbers = text.split(".").filter((a) => a !== "").map(Number);
  if (versionNumbers.length !== 3) {
    throw new Error(
      `Version string "${text}" does not have three numbers separated by dots.`,
    );
  }
  if (!versionNumbers.every(Number.isInteger)) {
    throw new Error(
      `Version string "${text}" contains non-numeric characters.`,
    );
  }
  return {
    major: versionNumbers[0],
    minor: versionNumbers[1],
    patch: versionNumbers[2],
  } as Version;
}

export function getVersionString(version: Version) {
  return `${version.major}.${version.minor}.${version.patch}`;
}

export function bumpVersion(version: Version, bumpType: BumpType) {
  switch (bumpType) {
    case "major":
      return {
        major: version.major + 1,
        minor: 0,
        patch: 0,
      };
    case "minor":
      return {
        major: version.major,
        minor: version.minor + 1,
        patch: 0,
      };
    case "patch":
      return {
        major: version.major,
        minor: version.minor,
        patch: version.patch + 1,
      };
  }
}
