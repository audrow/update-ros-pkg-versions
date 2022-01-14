import { makeCli } from "./cli/index.ts";
import { bumpFiles, getVersion, setFiles } from "./file_system/index.ts";
import { commitAndTag } from "./console/index.ts";
import {
  getVersionFromString,
  getVersionString,
} from "./update_package/index.ts";
import type { BumpFn, GetFn, SetFn, TagFn } from "./cli/index.ts";

const bumpFn: BumpFn = async (path, bumpType) => {
  await bumpFiles(path, bumpType);
};

const setFn: SetFn = async (path, version) => {
  await setFiles(path, getVersionFromString(version));
};

const getFn: GetFn = async (path) => {
  console.log(`Current Version: ${getVersionString(await getVersion(path))}`);
};

const tagFn: TagFn = async (path) => {
  const version = await getVersion(path);
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
