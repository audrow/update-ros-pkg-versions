export async function commitAndTag(cwd: string, version: string) {
  const commitCmd = ["git", "commit", "-asm", version];
  const tagCmd = ["git", "tag", version];

  await runCommand({
    cwd,
    cmd: commitCmd,
    error: `Failed to commit ${version}`,
  });
  await runCommand({ cwd, cmd: tagCmd, error: `Failed to tag: ${version}` });
}

async function runCommand(args: { cwd: string; cmd: string[]; error: string }) {
  const p = Deno.run({ cmd: args.cmd, cwd: args.cwd });
  const status = await p.status();
  if (!status.success) {
    throw new Error(args.error);
  }
}
