# README

A script for viewing, bumping, and setting package versions in `package.xml` and
`setup.py` files. It also tells you if your repo has different versions between
packages.

## Dependencies

This project depends on [Deno](https://deno.land/). You can install Deno with
the following command:

```bash
# Mac / Linux
curl -fsSL https://deno.land/x/install/install.sh | sh
```

```powershell
# Windows
iwr https://deno.land/x/install/install.ps1 -useb | iex
```

## Setup

To get started, clone this repository.

You can run this script with the following command:

```bash
cd update-ros-pkg-versions
deno run --allow-read --allow-write src/index.ts --help
```

To install this script, run the following command:

```bash
cd update-ros-pkg-versions
deno install --allow-read --allow-write --name update-ros-pkg-versions src/index.ts
# uninstall with
# deno uninstall update-ros-pkg-versions
```

Afterwards, you can run the script with `update-ros-pkg-versions`.

## Tests

You can test this program with the following command:

```bash
cd update-ros-pkg-versions
deno test --allow-read --allow-write --unstable
```
