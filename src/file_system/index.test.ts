import {
  bumpFiles,
  bumpFileVersion,
  getFileVersion,
  getPathsToFiles,
  getPathToFileDirectory,
  getVersion,
  setFiles,
  setFileVersion,
} from "./index.ts";

import { assertEquals, assertRejects, copy, join } from "../../deps.test.ts";
import { getVersionString } from "../update_package/index.ts";

const CURRENT_DIRECTORY = getPathToFileDirectory();
const EXAMPLE_PACKAGE_PATH = join(CURRENT_DIRECTORY, "example_package");
const BAD_VERSION_PACKAGE_PATH = join(CURRENT_DIRECTORY, "bad_version");
const TEST_PACKAGE_PATH = join(CURRENT_DIRECTORY, "test_package");
const TEST_PACKAGES_VERSION = "0.11.2";

async function isDirectory(path: string) {
  try {
    return (await Deno.stat(path)).isDirectory;
  } catch {
    return false;
  }
}

async function setupTestPackage() {
  if (await isDirectory(TEST_PACKAGE_PATH)) {
    await Deno.remove(TEST_PACKAGE_PATH, { recursive: true });
  }
  await copy(EXAMPLE_PACKAGE_PATH, TEST_PACKAGE_PATH);
}

async function teardownTestPackage() {
  if (await isDirectory(TEST_PACKAGE_PATH)) {
    await Deno.remove(TEST_PACKAGE_PATH, { recursive: true });
  }
}

function runTest(name: string, test: () => Promise<void>) {
  Deno.test(name, async () => {
    await setupTestPackage();
    await test();
    await teardownTestPackage();
  });
}

runTest("get files in folder", async () => {
  const paths = await getPathsToFiles(TEST_PACKAGE_PATH, [
    /package.xml$/,
    /setup.py$/,
  ]);
  assertEquals(paths.length, 5);
});

runTest("get all package versions", async () => {
  const paths = await getPathsToFiles(TEST_PACKAGE_PATH, [
    /package.xml$/,
    /setup.py$/,
  ]);
  for (const path of paths) {
    const version = await getFileVersion(path);
    assertEquals(getVersionString(version), TEST_PACKAGES_VERSION);
  }
});

runTest("set all package versions", async () => {
  const newVersion = { major: 1, minor: 2, patch: 3 };
  const paths = await getPathsToFiles(TEST_PACKAGE_PATH, [
    /package.xml$/,
    /setup.py$/,
  ]);
  for (const path of paths) {
    await setFileVersion(path, newVersion);
    const version = await getFileVersion(path);
    assertEquals(version, newVersion);
  }
});

runTest("bump all package version - patch", async () => {
  const paths = await getPathsToFiles(TEST_PACKAGE_PATH, [
    /package.xml$/,
    /setup.py$/,
  ]);
  for (const path of paths) {
    await bumpFileVersion(path, "patch");
    const version = await getFileVersion(path);
    assertEquals(getVersionString(version), "0.11.3");
  }
});

runTest("bump all package version - minor", async () => {
  const paths = await getPathsToFiles(TEST_PACKAGE_PATH, [
    /package.xml$/,
    /setup.py$/,
  ]);
  for (const path of paths) {
    await bumpFileVersion(path, "minor");
    const version = await getFileVersion(path);
    assertEquals(getVersionString(version), "0.12.0");
  }
});

runTest("bump all package version - major", async () => {
  const paths = await getPathsToFiles(TEST_PACKAGE_PATH, [
    /package.xml$/,
    /setup.py$/,
  ]);
  for (const path of paths) {
    await bumpFileVersion(path, "major");
    const version = await getFileVersion(path);
    assertEquals(getVersionString(version), "1.0.0");
  }
});

runTest("set version at once", async () => {
  const newVersion = { major: 1, minor: 2, patch: 3 };
  await setFiles(TEST_PACKAGE_PATH, newVersion);
  const readVersion = await getVersion(TEST_PACKAGE_PATH);
  assertEquals(readVersion, newVersion);
});

runTest("get package version for all packages", async () => {
  assertEquals(
    getVersionString(
      await getVersion(TEST_PACKAGE_PATH),
    ),
    TEST_PACKAGES_VERSION,
  );
});

runTest("throw for package with different versions", async () => {
  await assertRejects(async () => {
    await getVersion(BAD_VERSION_PACKAGE_PATH);
  });
});

runTest("bump package version all packages at once - minor", async () => {
  await bumpFiles(TEST_PACKAGE_PATH, "minor");
  const version = await getVersion(TEST_PACKAGE_PATH);
  assertEquals(getVersionString(version), "0.12.0");
});
