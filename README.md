# README

A script for viewing, bumping, and setting package versions in ROS 2
`package.xml`, `setup.py`, and `CHANGELOG.rst` files. It also tells you if your
repo has different versions between packages and can create commits and tags for
the new versions.

- [Setup](#setup)
- [Usage](#usage)
  - [Available Commands](#available-commands)
  - [Suggested Workflow](#suggested-workflow)
    - [Bumping a ROS Repository's Version](#bumping-a-ros-repositorys-version)
    - [Updating a Repository with Inconsistent Package Versions](#updating-a-repository-with-inconsistent-package-versions)
- [Tests](#tests)

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
make install
```

You can use `make uninstall` to uninstall this script.

Afterwards, you can run the script with `update-ros-pkg-versions`.

## Usage

### Available Commands

Use `-h` or `--help` to access help. From here you can see the available
commands and their options. You can also use help with subcommands.

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
Current Version: 0.11.2

Files that were not updated:

* ros1_pkg/package.xml: Cannot set version for ROS 1 file: ros1_pkg/package.xml
* ros1_pkg/setup.py: Cannot set version for ROS 1 file: ros1_pkg/setup.py
```

If you have inconsistent versioning (of if you just know the version you want),
you can set all the versions at once with the `set` command:

```bash
$ update-ros-pkg-versions set 1.2.3
Done!
$ update-ros-pkg-versions get
Current Version: 1.2.3
```

Note that you can use `--tag` to commit and tag the repo after making a bump.

```bash
$ update-ros-pkg-versions set 1.2.3 --tag
Done!
```

Otherwise, you can bump the version (note, `--tag` is also an option here):

```bash
$ update-ros-pkg-versions bump --type minor # patch is default
Done!
$ update-ros-pkg-versions get
update-ros-pkg-versions get Current Version: 0.12.0
```

If you've updated the version and would like to create a commit and tag (and you
didn't do it from `set` or `bump` with the `--tag` flag), you can run the
following command:

```bash
$ update-ros-pkg-versions tag
Done!
```

Note that the commands have an `--skip-setup-py` option. This is useful when a
package hasn't add a version tag to one or more `setup.py` files.

Also, ROS 1 packages will be skipped. This program skips any files that mention
`catkin`.

### Suggested Workflow

#### Bumping a ROS Repository's Version

1. Run `catkin_generate_changelog`
2. Check and edit the changelog
3. Bump the version, for example:

   ```bash
   update-ros-pkg-versions bump --type minor # patch is default
   ```

4. Create a commit and tag with

   ```bash
   $ update-ros-pkg-versions tag
   ```

5. Push the new tag and commit:

   ```bash
   git push --tags
   ```

Note that step 3 and 4 can be consolidated into the following command:

```bash
update-ros-pkg-versions bump --type minor --tag
```

#### Updating a Repository with Inconsistent Package Versions

This may occur, for example, if a previous tag was made without updating the
`setup.py` files.

1. Run `catkin_generate_changelog`
2. Check and edit the changelog
3. Try to bump the version, but an error will occur. Use this error to get the
   current versions used.
   ```bash
   $ update-ros-pkg-versions bump
   error: Uncaught (in promise) Error: Version is not consistent - got the following versions: 0.11.2, 0.11.3
   ```
4. Set the version to the desired new version, for example:

   ```bash
   update-ros-pkg-versions set 0.11.4
   ```

5. Create a commit and tag with

   ```bash
   $ update-ros-pkg-versions tag
   ```

6. Push the new tag and commit:

   ```bash
   git push --tags
   ```

Note that step 4 and 5 can be consolidated into the following command:

```bash
update-ros-pkg-versions set 0.11.4 --tag
```

## Tests

You can test this program with the following command:

```bash
make test # or make test-all to run the tests, linter, and formatter
```
