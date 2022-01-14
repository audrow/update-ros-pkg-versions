import { makeCli } from "./index.ts";

import { assert, assertEquals } from "../../deps.test.ts";

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
  const { fn: tagFn, watcher: tagWatcher } = mockFnMaker();
  const cli = makeCli({
    bumpFn,
    setFn,
    getFn,
    tagFn,
    defaultBumpType: "patch",
  });
  const run = (args: string[]) => {
    return cli.parse(["", "", ...args], { run: true });
  };
  return {
    run,
    bumpFn,
    setFn,
    getFn,
    tagFn,
    bumpWatcher,
    setWatcher,
    getWatcher,
    tagWatcher,
  };
}

Deno.test("call bump without args", () => {
  const cli = makeTestCli();
  assert(!cli.bumpWatcher.isCalled());
  cli.run(["bump"]);
  assert(cli.bumpWatcher.isCalled());
  assertEquals(cli.bumpWatcher.callArgs()[0], Deno.cwd());
  assertEquals(cli.bumpWatcher.callArgs()[1], "patch");
  assert(!cli.setWatcher.isCalled());
});

Deno.test("call bump with path", () => {
  const cli = makeTestCli();
  assert(!cli.bumpWatcher.isCalled());
  cli.run(["bump", "--directory", "some/path"]);
  assert(cli.bumpWatcher.isCalled());
  assertEquals(cli.bumpWatcher.callArgs()[0], "some/path");
  assertEquals(cli.bumpWatcher.callArgs()[1], "patch");
  assert(!cli.setWatcher.isCalled());
});

Deno.test("call bump with options", () => {
  {
    const cli = makeTestCli();
    assert(!cli.bumpWatcher.isCalled());
    cli.run(["bump", "--type", "minor", "--stop-on-error", "--skip-setup-py"]);
    assert(cli.bumpWatcher.isCalled());
    assertEquals(cli.bumpWatcher.callArgs()[0], Deno.cwd());
    assertEquals(cli.bumpWatcher.callArgs()[1], "minor");
    assertEquals(cli.bumpWatcher.callArgs()[2], true);
    assertEquals(cli.bumpWatcher.callArgs()[3], true);
    assert(!cli.setWatcher.isCalled());
  }
  {
    const cli = makeTestCli();
    assert(!cli.bumpWatcher.isCalled());
    cli.run(["bump", "--type", "minor"]);
    assert(cli.bumpWatcher.isCalled());
    assertEquals(cli.bumpWatcher.callArgs()[0], Deno.cwd());
    assertEquals(cli.bumpWatcher.callArgs()[1], "minor");
    assertEquals(cli.bumpWatcher.callArgs()[2], false);
    assertEquals(cli.bumpWatcher.callArgs()[3], false);
    assert(!cli.setWatcher.isCalled());
  }
});

Deno.test("call set with path", () => {
  {
    const cli = makeTestCli();
    assert(!cli.setWatcher.isCalled());
    cli.run([
      "set",
      "--directory",
      "some/path",
      "1.2.3",
      "--skip-setup-py",
      "--stop-on-error",
    ]);
    assert(cli.setWatcher.isCalled());
    assert(cli.setWatcher.callArgs()[0] === "some/path");
    assert(cli.setWatcher.callArgs()[1] === "1.2.3");
    assert(cli.setWatcher.callArgs()[2] === true);
    assert(cli.setWatcher.callArgs()[3] === true);
    assert(!cli.bumpWatcher.isCalled());
  }
  {
    const cli = makeTestCli();
    assert(!cli.setWatcher.isCalled());
    cli.run(["set", "--directory", "some/path", "1.2.3"]);
    assert(cli.setWatcher.isCalled());
    assert(cli.setWatcher.callArgs()[0] === "some/path");
    assert(cli.setWatcher.callArgs()[1] === "1.2.3");
    assert(cli.setWatcher.callArgs()[2] === false);
    assert(cli.setWatcher.callArgs()[3] === false);
    assert(!cli.bumpWatcher.isCalled());
  }
});

Deno.test("call get with path", () => {
  const cli = makeTestCli();
  assert(!cli.getWatcher.isCalled());
  cli.run(["get", "--directory", "some/path"]);
  assert(cli.getWatcher.isCalled());
  assert(cli.getWatcher.callArgs()[0] === "some/path");
  assert(!cli.bumpWatcher.isCalled());
});

Deno.test("call tag with path", () => {
  const cli = makeTestCli();
  assert(!cli.tagWatcher.isCalled());
  cli.run(["tag", "--directory", "some/path"]);
  assert(cli.tagWatcher.isCalled());
  assert(cli.tagWatcher.callArgs()[0] === "some/path");
  assert(!cli.bumpWatcher.isCalled());
});
