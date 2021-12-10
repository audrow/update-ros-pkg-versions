# README

A script for viewing, bumping, and setting package versions in `package.xml` and
`setup.py` files. It also tells you if your repo has different versions between
packages.

## Usage

To get started, clone this repository, install Deno.

You can run this script with the following command:

```bash
cd update-package-versions
deno run --allow-read --allow-write src/index.ts --help
```

To install this script, run the following command:

```bash
cd update-package-versions
deno install --allow-read --allow-write --name update-ros-pkg-versions src/index.ts
# uninstall with
# deno uninstall update-ros-pkg-versions
```

Afterwards, you can run the script with `update-ros-pkg-versions`.

## Tests

You can test this program with the following command:

```bash
cd update-package-versions
deno test --allow-read --allow-write --unstable
```
