import { makeCli } from "./cli/index.ts";
import { bumpFiles, getVersion, setFiles } from "./file_system/index.ts";
import { commitAndTag } from "./console/index.ts";
import {
  getVersionFromString,
  getVersionString,
} from "./update_package/index.ts";
import type { BumpFn, GetFn, SetFn, TagFn } from "./cli/index.ts";
import type { Status } from "./file_system/types.ts";

function logFailures(statuses: Status[]) {
  const errors = statuses.filter((status) => !status.isSuccess);
  if (errors.length > 0) {
    console.error("Files with errors:\n");
    for (const error of errors) {
      console.error(`* ${error.file}: ${error.message}`);
    }
    console.error();
  }
}

const bumpFn: BumpFn = async (path, bumpType, isSkipSetupPy, isStopOnError) => {
  const statuses = await bumpFiles(
    path,
    bumpType,
    isSkipSetupPy,
    isStopOnError,
  );
  logFailures(statuses);
};

const setFn: SetFn = async (path, version, isSkipSetupPy, isStopOnError) => {
  const statuses = await setFiles(
    path,
    getVersionFromString(version),
    isSkipSetupPy,
    isStopOnError,
  );
  logFailures(statuses);
};

const getFn: GetFn = async (path, isSkipSetupPy, isStopOnError) => {
  const { version, statuses } = await getVersion(path, isSkipSetupPy, {
    isStopOnError,
  });
  console.log(
    `\nCurrent Version: ${getVersionString(version)}\n`,
  );
  logFailures(statuses);
};

const tagFn: TagFn = async (path, isSkipSetupPy) => {
  const { version } = await getVersion(path, isSkipSetupPy);
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
