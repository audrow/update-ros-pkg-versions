import { cac } from "../../deps.ts";
import { BumpType } from "../update_package/types.ts";

export type BumpFn = (path: string, bumpType: BumpType) => Promise<void>;
export type SetFn = (path: string, version: string) => Promise<void>;
export type GetFn = (path: string) => Promise<void>;
export type TagFn = (path: string) => Promise<void>;

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

  cli
    .command("bump", "Update package versions in a directory")
    .option("-t, --type <type>", "patch, minor, or major", {
      default: args.defaultBumpType,
    })
    .option("--tag", "Commit and tag the new version", {
      default: false,
    })
    .option("-d, --directory <directory>", "Directory to update", {
      default: ".",
    })
    .action(async (options) => {
      const { directory, type, tag } = options;
      await args.bumpFn(directory, type as BumpType);
      if (tag) {
        await args.tagFn(directory);
      }
    });

  cli
    .command("tag", "Tag a package version")
    .option("-d, --directory <directory>", "Directory to update", {
      default: ".",
    })
    .action(async (options) => {
      const { directory } = options;
      await args.tagFn(directory);
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
