import { makeCli } from "./index.ts";

import { assert } from "../../deps.test.ts";

function mockFnMaker() {
  let isCalled = false;
  let callArgs: unknown[] = [];

  return {
    fn: (...args: unknown[]) => {
      isCalled = true;
      callArgs = args;
      return Promise.resolve();
    },
    watcher: {
      isCalled: () => isCalled,
      callArgs: () => callArgs,
    },
  };
}

function makeTestCli() {
  const { fn: bumpFn, watcher: bumpWatcher } = mockFnMaker();
  const { fn: setFn, watcher: setWatcher } = mockFnMaker();
  const { fn: getFn, watcher: getWatcher } = mockFnMaker();
  const cli = makeCli({ bumpFn, setFn, getFn, defaultBumpType: "patch" });
  const run = (args: string[]) => {
    return cli.parse(["", "", ...args], { run: true });
  };
  return { run, bumpFn, setFn, getFn, bumpWatcher, setWatcher, getWatcher };
}

Deno.test("call bump without args", () => {
  const cli = makeTestCli();
  assert(!cli.bumpWatcher.isCalled());
  cli.run(["bump"]);
  assert(cli.bumpWatcher.isCalled());
  assert(cli.bumpWatcher.callArgs()[0] === ".");
  assert(cli.bumpWatcher.callArgs()[1] === "patch");
  assert(!cli.setWatcher.isCalled());
});

Deno.test("call bump with path", () => {
  const cli = makeTestCli();
  assert(!cli.bumpWatcher.isCalled());
  cli.run(["bump", "--directory", "some/path"]);
  assert(cli.bumpWatcher.isCalled());
  assert(cli.bumpWatcher.callArgs()[0] === "some/path");
  assert(cli.bumpWatcher.callArgs()[1] === "patch");
  assert(!cli.setWatcher.isCalled());
});

Deno.test("call bump with path", () => {
  const cli = makeTestCli();
  assert(!cli.bumpWatcher.isCalled());
  cli.run(["bump", "--bump-type", "minor"]);
  assert(cli.bumpWatcher.isCalled());
  assert(cli.bumpWatcher.callArgs()[0] === ".");
  assert(cli.bumpWatcher.callArgs()[1] === "minor");
  assert(!cli.setWatcher.isCalled());
});

Deno.test("call set with path", () => {
  const cli = makeTestCli();
  assert(!cli.setWatcher.isCalled());
  cli.run(["set", "--directory", "some/path", "1.2.3"]);
  assert(cli.setWatcher.isCalled());
  assert(cli.setWatcher.callArgs()[0] === "some/path");
  assert(cli.setWatcher.callArgs()[1] === "1.2.3");
  assert(!cli.bumpWatcher.isCalled());
});

Deno.test("call get with path", () => {
  const cli = makeTestCli();
  assert(!cli.getWatcher.isCalled());
  cli.run(["get", "--directory", "some/path"]);
  assert(cli.getWatcher.isCalled());
  assert(cli.getWatcher.callArgs()[0] === "some/path");
  assert(!cli.bumpWatcher.isCalled());
});
