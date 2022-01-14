import { cac } from "../../deps.ts";
import { BumpType } from "../update_package/types.ts";

export type BumpFn = (
  path: string,
  bumpType: BumpType,
  isSkipSetupPy: boolean,
  isStopOnError: boolean,
) => Promise<void>;
export type SetFn = (
  path: string,
  version: string,
  isSkipSetupPy: boolean,
  isStopOnError: boolean,
) => Promise<void>;
export type GetFn = (
  path: string,
  isSkipSetupPy: boolean,
  isStopOnError: boolean,
) => Promise<void>;
export type TagFn = (
  path: string,
  isSkipSetupPy: boolean,
) => Promise<void>;

export function makeCli(args: {
  name?: string;
  defaultBumpType?: BumpType;
  version?: string;
  bumpFn: BumpFn;
  setFn: SetFn;
  getFn: GetFn;
  tagFn: TagFn;
}) {
  if (!args.name) {
    args.name = "update-ros-pkg-versions";
  }
  if (!args.defaultBumpType) {
    args.defaultBumpType = "patch";
  }
  if (!args.version) {
    args.version = "1.0.0";
  }

  const cli = cac(args.name);
  cli.help(); // show help when --help or -h is passed
  cli.version(args.version);
  const defaultDir = Deno.cwd();

  cli
    .command("bump", "Update package versions in a directory")
    .option("-d, --directory <directory>", "Directory to update", {
      default: defaultDir,
    })
    .option("--skip-setup-py", "Skip updating setup.py", {
      default: false,
    })
    .option("--stop-on-error", "Stop on first error", {
      default: false,
    })
    .option("-t, --type <type>", "patch, minor, or major", {
      default: args.defaultBumpType,
    })
    .option("--tag", "Commit and tag the new version", {
      default: false,
    })
    .action(async (options) => {
      const { directory, type, tag, skipSetupPy, stopOnError } = options;
      await args.bumpFn(directory, type as BumpType, skipSetupPy, stopOnError);
      if (tag) {
        await args.tagFn(directory, skipSetupPy);
      }
      console.log(`Done!`);
    });

  cli
    .command("get", "Get package versions in a directory")
    .option("-d, --directory <directory>", "Directory to update", {
      default: defaultDir,
    })
    .option("--skip-setup-py", "Skip updating setup.py", {
      default: false,
    })
    .option("--stop-on-error", "Stop on first error", {
      default: false,
    })
    .action(async (options) => {
      const { directory, skipSetupPy, stopOnError } = options;
      await args.getFn!(directory, skipSetupPy, stopOnError);
    });

  cli
    .command("set <version>", "Set package versions in a directory")
    .option("-d, --directory <directory>", "Directory to update", {
      default: defaultDir,
    })
    .option("--skip-setup-py", "Skip updating setup.py", {
      default: false,
    })
    .option("--stop-on-error", "Stop on first error", {
      default: false,
    })
    .option("--tag", "Commit and tag the new version", {
      default: false,
    })
    .action(async (version, options) => {
      const { directory, tag, skipSetupPy, stopOnError } = options;
      await args.setFn(directory, version, skipSetupPy, stopOnError);
      if (tag) {
        await args.tagFn(directory, skipSetupPy);
      }
      console.log(`Done!`);
    });

  cli
    .command("tag", "Tag a package version")
    .option("-d, --directory <directory>", "Directory to update", {
      default: ".",
    })
    .option("--skip-setup-py", "Skip updating setup.py", {
      default: false,
    })
    .action(async (options) => {
      const { directory, skipSetupPy } = options;
      await args.tagFn(directory, skipSetupPy);
      console.log(`Done!`);
    });

  return cli;
}
