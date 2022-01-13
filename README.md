# README

A script for viewing, bumping, and setting package versions in `package.xml`,
`setup.py`, and `CHANGELOG.rst` files. It also tells you if your repo has
different versions between packages.

## Setup

This project depends on [Deno](https://deno.land/). You can install Deno with
the following command:

```bash
# Mac / Linux
curl -fsSL https://deno.land/install.sh | sh
```

```powershell
# Windows
iwr https://deno.land/install.ps1 -useb | iex
```

The easiest way to work with this script is to install it with Deno. To do this,
clone this repository and run the following command:

```bash
cd update-ros-pkg-versions
deno install --allow-read --allow-write --name update-ros-pkg-versions src/index.ts
# uninstall with
# deno uninstall update-ros-pkg-versions
```

Afterwards, you can run the script with `update-ros-pkg-versions`.

## Usage

Use `-h` or `--h` to access help. From here you can see the available commands
and their options. You can also use help with subcommands.

```
update-ros-pkg-versions --help
update-ros-pkg-versions bump -h
```

You can go into `update-ros-pkg-versions/src/file_system/example_package` for an
example package to test out commands on.

You can get the current version with the following command:

```bash
# cd update-ros-pkg-versions/src/file_system/example_package
$ update-ros-pkg-versions get
Current Version: 0.11.2
```

If the package has inconsistent versioning, you will see an error like the
following:

```bash
$ update-ros-pkg-versions get
error: Uncaught (in promise) Error: Version is not consistent - got the following versions: 0.11.2, 0.11.3
```

If you have inconsistent versioning (of if you just know the version you want),
you can set all the versions at once with the `set` command:

```bash
$ update-ros-pkg-versions set 1.2.3
Done!
$ update-ros-pkg-versions get
Current Version: 1.2.3
```

Otherwise, you can bump the version:

```bash
$ update-ros-pkg-versions bump --type minor # patch is default
Done!
$ update-ros-pkg-versions get
update-ros-pkg-versions get Current Version: 0.12.0
```

## Tests

You can test this program with the following command:

```bash
cd update-ros-pkg-versions
deno test --allow-read --allow-write --unstable
```
