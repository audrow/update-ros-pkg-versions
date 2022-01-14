import { makeCli } from "./cli/index.ts";
import { bumpFiles, getVersion, setFiles } from "./file_system/index.ts";
import { commitAndTag } from "./console/index.ts";
import {
  getVersionFromString,
  getVersionString,
} from "./update_package/index.ts";
import type { BumpFn, GetFn, SetFn, TagFn } from "./cli/index.ts";

const bumpFn: BumpFn = async (path, bumpType, isSkipSetupPy) => {
  await bumpFiles(path, bumpType, isSkipSetupPy);
};

const setFn: SetFn = async (path, version, isSkipSetupPy) => {
  await setFiles(path, getVersionFromString(version), isSkipSetupPy);
};

const getFn: GetFn = async (path, isSkipSetupPy) => {
  console.log(
    `Current Version: ${
      getVersionString(await getVersion(path, isSkipSetupPy))
    }`,
  );
};

const tagFn: TagFn = async (path, isSkipSetupPy) => {
  const version = await getVersion(path, isSkipSetupPy);
  await commitAndTag(path, getVersionString(version));
};

const cli = makeCli({
  name: "update-ros-pkg-versions",
  defaultBumpType: "patch",
  version: "1.0.1",
  bumpFn,
  setFn,
  getFn,
  tagFn,
});
cli.parse();
