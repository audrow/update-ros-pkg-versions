import { cac } from "../../deps.ts";
import { BumpType } from "../update_package/types.ts";

export type BumpFn = (path: string, bumpType: BumpType) => Promise<void>;
export type SetFn = (path: string, version: string) => Promise<void>;
export type GetFn = (path: string) => Promise<void>;

export function makeCli(args: {
  name?: string;
  defaultBumpType?: BumpType;
  version?: string;
  bumpFn: BumpFn;
  setFn: SetFn;
  getFn: GetFn;
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

  cli
    .command("bump", "Update package versions in a directory")
    .option("--bump-type <type>", "patch, minor, or major", {
      default: args.defaultBumpType,
    })
    .option("-d, --directory <directory>", "Directory to update", {
      default: ".",
    })
    .action(async (options) => {
      const { directory, bumpType } = options;
      await args.bumpFn(directory, bumpType as BumpType);
    });

  cli
    .command("set <version>", "Set package versions in a directory")
    .option("-d, --directory <directory>", "Directory to update", {
      default: ".",
    })
    .action(async (version, options) => {
      const { directory } = options;
      await args.setFn(directory, version);
    });

  cli
    .command("get", "Get package versions in a directory")
    .option("-d, --directory <directory>", "Directory to update", {
      default: ".",
    })
    .action(async (options) => {
      const { directory } = options;
      await args.getFn!(directory);
    });

  return cli;
}
