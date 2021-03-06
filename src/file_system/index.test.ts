import {
  bumpFiles,
  getPathsToRos2Files,
  getPathToFileDirectory,
  getRos2FilePaths,
  getVersion,
  setFiles,
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
  {
    const paths = await getPathsToRos2Files(TEST_PACKAGE_PATH, [
      /\/package.xml$/,
      /\/setup.py$/,
      /\/CHANGELOG.rst$/,
    ]);
    assertEquals(paths.length, 6);
  }
  // {
  //   const paths = await getRos2FilePaths(TEST_PACKAGE_PATH, {});
  //   assertEquals(paths.length, 7, "default");
  // }
  // {
  //   const paths = await getRos2FilePaths(TEST_PACKAGE_PATH, {
  //     isIncludeChangeLog: true,
  //   });
  //   assertEquals(paths.length, 8, "includes changelog");
  // }
  // {
  //   const paths = await getRos2FilePaths(TEST_PACKAGE_PATH, {
  //     isSkipPackageXml: true,
  //   });
  //   assertEquals(paths.length, 3, "skip package.xml");
  // }
  // {
  //   const paths = await getRos2FilePaths(TEST_PACKAGE_PATH, {
  //     isSkipSetupPy: true,
  //   });
  //   assertEquals(paths.length, 4, "skip setup.py");
  // }
  // {
  //   const paths = await getRos2FilePaths(TEST_PACKAGE_PATH, {
  //     isSkipSetupPy: true,
  //     isSkipPackageXml: true,
  //   });
  //   assertEquals(paths.length, 0, "skips everything");
  // }
});

// // TODO: Enable these tests
// runTest("get all package versions", async () => {
//   const paths = await getPathsToRos2Files(TEST_PACKAGE_PATH, [
//     /\/package.xml$/,
//     /\/setup.py$/,
//   ]);
//   for (const path of paths) {
//     const { version } = await getVersion(path);
//     assertEquals(getVersionString(version), TEST_PACKAGES_VERSION);
//   }
// });

// runTest("set all package versions", async () => {
//   const newVersion = { major: 1, minor: 2, patch: 3 };
//   const paths = await getRos2FilePaths(TEST_PACKAGE_PATH, {
//     isIncludeChangeLog: false,
//   });
//   for (const path of paths) {
//     await setFileVersion(path, newVersion);
//     const version = await getVersion(path);
//     assertEquals(version, newVersion);
//   }
// });

// runTest("bump all package version - patch", async () => {
//   const paths = await getRos2FilePaths(TEST_PACKAGE_PATH, {
//     isIncludeChangeLog: false,
//   });
//   for (const path of paths) {
//     await bumpFileVersion(path, "patch");
//     const { version } = await getVersion(path);
//     assertEquals(getVersionString(version), "0.11.3");
//   }
// });

// runTest("bump all package version - minor", async () => {
//   const paths = await getRos2FilePaths(TEST_PACKAGE_PATH, {
//     isIncludeChangeLog: false,
//   });
//   for (const path of paths) {
//     await bumpFileVersion(path, "minor");
//     const { version } = await getVersion(path);
//     assertEquals(getVersionString(version), "0.12.0");
//   }
// });

// runTest("bump all package version - major", async () => {
//   const paths = await getRos2FilePaths(TEST_PACKAGE_PATH, {
//     isIncludeChangeLog: false,
//   });
//   for (const path of paths) {
//     await bumpFileVersion(path, "major");
//     const { version }= await getVersion(path);
//     assertEquals(getVersionString(version), "1.0.0");
//   }
// });

runTest("set version at once", async () => {
  const newVersion = { major: 1, minor: 2, patch: 3 };
  await setFiles(TEST_PACKAGE_PATH, newVersion);
  const { version } = await getVersion(TEST_PACKAGE_PATH);
  assertEquals(version, newVersion);
});

runTest("get package version for all packages", async () => {
  const { version } = await getVersion(TEST_PACKAGE_PATH);
  assertEquals(
    getVersionString(version),
    TEST_PACKAGES_VERSION,
  );
});

runTest("throw for package with different versions", async () => {
  await assertRejects(async () => {
    await getVersion(BAD_VERSION_PACKAGE_PATH, undefined, {
      isStopOnError: true,
    });
  });
});

runTest("bump package version all packages at once - minor", async () => {
  await bumpFiles(TEST_PACKAGE_PATH, "minor", false);
  const { version } = await getVersion(TEST_PACKAGE_PATH);
  assertEquals(getVersionString(version), "0.12.0");
});
