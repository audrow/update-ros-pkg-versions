import {
  bumpVersion,
  getPackageXmlVersion,
  getSetupPyVersion,
  getVersionFromString,
  getVersionString,
  isRos1File,
  setChangeLogVersion,
  setPackageXmlVersion,
  setSetupPyVersion,
} from "./index.ts";
import { BumpType, Version } from "./types.ts";
import { format } from "../../deps.ts";

import { assert, assertEquals, assertThrows } from "../../deps.test.ts";

const VERSION_STRING = "1.2.3";
const version: Version = {
  major: 1,
  minor: 2,
  patch: 3,
};

function getPackageXmlContent(version: string) {
  return `<?xml version="1.0"?>
<?xml-model href="http://download.ros.org/schema/package_format2.xsd" schematypens="http://www.w3.org/2001/XMLSchema"?>
<package format="2">
  <name>ament_clang_format</name>
  <version>${version}</version>
  <description>
    The ability to check code against style conventions using
    clang-format and generate xUnit test result files.</description>

  <maintainer email="michael.jeronimo@openrobotics.org">Michael Jeronimo</maintainer>
  <maintainer email="michel@ekumenlabs.com">Michel Hidalgo</maintainer>

  <license>Apache License 2.0</license>

  <author email="audrow@openrobotics.org">Audrow Nash</author>
  <author>Claire Wang</author>
  <author>Dirk Thomas</author>

  <exec_depend>clang-format</exec_depend>
  <exec_depend>python3-yaml</exec_depend>

  <test_depend>ament_copyright</test_depend>
  <test_depend>ament_flake8</test_depend>
  <test_depend>ament_pep257</test_depend>
  <test_depend>python3-pytest</test_depend>

  <export>
    <build_type>ament_python</build_type>
  </export>
</package>`;
}

function getRos1PackageXml() {
  return `<?xml version="1.0"?>
<?xml-model href="http://download.ros.org/schema/package_format2.xsd" schematypens="http://www.w3.org/2001/XMLSchema"?>
<package format="2">
  <name>base_local_planner</name>
  <version>1.17.1</version>
  <description>
    This package provides implementations of the Trajectory Rollout and Dynamic Window approaches to local robot navigation on a plane. Given a plan to follow and a costmap, the controller produces velocity commands to send to a mobile base. This package supports both holonomic and non-holonomic robots, any robot footprint that can be represented as a convex polygon or circle, and exposes its configuration as ROS parameters that can be set in a launch file. This package's ROS wrapper adheres to the BaseLocalPlanner interface specified in the <a href="http://wiki.ros.org/nav_core">nav_core</a> package. 
  </description>
  <author>Eitan Marder-Eppstein</author>
  <author>Eric Perko</author>
  <author>contradict@gmail.com</author>
  <maintainer email="mfergs7@gmail.com">Michael Ferguson</maintainer>
  <maintainer email="davidvlu@gmail.com">David V. Lu!!</maintainer>
  <maintainer email="ahoy@fetchrobotics.com">Aaron Hoy</maintainer>
  <license>BSD</license>
  <url>http://wiki.ros.org/base_local_planner</url>

  <buildtool_depend version_gte="0.5.68">catkin</buildtool_depend>

  <build_depend>cmake_modules</build_depend>
  <build_depend>message_generation</build_depend>
  <build_depend>tf2_geometry_msgs</build_depend>

  <depend>angles</depend>
  <depend>costmap_2d</depend>
  <exec_depend>message_runtime</exec_depend>

  <test_depend>rosunit</test_depend>
  <export>
      <nav_core plugin="\${prefix}/blp_plugin.xml" />
  </export>
</package>`;
}

function getSetupPyContent(version: string) {
  return `from setuptools import find_packages
from setuptools import setup

package_name = 'ament_clang_format'

setup(
    name=package_name,
    version='${version}',
    packages=find_packages(exclude=['test']),
    data_files=[
        ('share/' + package_name, ['package.xml']),
        ('share/ament_index/resource_index/packages',
            ['resource/' + package_name]),
    ],
    install_requires=['setuptools', 'pyyaml'],
    package_data={'': [
        'configuration/.clang-format',
    ]},
    zip_safe=False,
    author='Dirk Thomas',
    author_email='dthomas@osrfoundation.org',
    maintainer='Michael Jeronimo, Michel Hidalgo',
    maintainer_email='michael.jeronimo@openrobotics.org, michel@ekumenlabs.com',
    url='https://github.com/ament/ament_lint',
    download_url='https://github.com/ament/ament_lint/releases',
    keywords=['ROS'],
    classifiers=[
        'Intended Audience :: Developers',
        'License :: OSI Approved :: Apache Software License',
        'Programming Language :: Python',
        'Topic :: Software Development',
    ],
    description='Check C++ code style using clang-format.',
    long_description="""\
The ability to check code against style conventions using clang-format
and generate xUnit test result files.""",
    license='Apache License, Version 2.0, BSD',
    tests_require=['pytest'],
    entry_points={
        'console_scripts': [
            'ament_clang_format = ament_clang_format.main:main',
        ],
    },
)`;
}

function getSetupPyVariableSetContent(version: string) {
  return `from setuptools import find_packages
from setuptools import setup

package_name = 'ament_clang_format'

version_var = '${version}'
setup(
    name=package_name,
    version=version,
    packages=find_packages(exclude=['test']),
    data_files=[
        ('share/' + package_name, ['package.xml']),
        ('share/ament_index/resource_index/packages',
            ['resource/' + package_name]),
    ],
    install_requires=['setuptools', 'pyyaml'],
    package_data={'': [
        'configuration/.clang-format',
    ]},
    zip_safe=False,
    author='Dirk Thomas',
    author_email='dthomas@osrfoundation.org',
    maintainer='Michael Jeronimo, Michel Hidalgo',
    maintainer_email='michael.jeronimo@openrobotics.org, michel@ekumenlabs.com',
    url='https://github.com/ament/ament_lint',
    download_url='https://github.com/ament/ament_lint/releases',
    keywords=['ROS'],
    classifiers=[
        'Intended Audience :: Developers',
        'License :: OSI Approved :: Apache Software License',
        'Programming Language :: Python',
        'Topic :: Software Development',
    ],
    description='Check C++ code style using clang-format.',
    long_description="""\
The ability to check code against style conventions using clang-format
and generate xUnit test result files.""",
    license='Apache License, Version 2.0, BSD',
    tests_require=['pytest'],
    entry_points={
        'console_scripts': [
            'ament_clang_format = ament_clang_format.main:main',
        ],
    },
)`;
}

function getRos1SetupPy() {
  return `#!/usr/bin/env python
from distutils.core import setup
from catkin_pkg.python_setup import generate_distutils_setup

d = generate_distutils_setup(
    packages = ['local_planner_limits'],
    package_dir = {'': 'src'},
    )

setup(**d)`;
}

function getUnsetChangelogContent() {
  return `^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
Changelog for package ament_clang_format
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

Forthcoming
-----------
* Update maintainers to Michael Jeronimo and Michel Hidalgo (\`#362 <https://github.com/ament/ament_cmake/issues/362>\`_)
* Contributors: Audrow Nash

1.2.0 (2021-10-29)
------------------
* Add ament_cmake_gen_version_h package (\`#198 <https://github.com/ament/ament_cmake/issues/198>\`_)
* Use FindPython3 instead of FindPythonInterp (\`#355 <https://github.com/ament/ament_cmake/issues/355>\`_)
* Update maintainers (\`#336 <https://github.com/ament/ament_cmake/issues/336>\`_)
* Contributors: Chris Lalancette, Shane Loretz, serge-nikulin

1.1.4 (2021-05-06)
------------------

1.1.3 (2021-03-09)
------------------

`;
}

function getChangelogContent(version: string, date: Date) {
  const heading = `${version} (${format(date, "yyyy-MM-dd")})`;
  const replacementText = heading + "\n" + "-".repeat(heading.length);

  return `^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
Changelog for package ament_clang_format
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

${replacementText}
* Update maintainers to Michael Jeronimo and Michel Hidalgo (\`#362 <https://github.com/ament/ament_cmake/issues/362>\`_)
* Contributors: Audrow Nash

1.2.0 (2021-10-29)
------------------
* Add ament_cmake_gen_version_h package (\`#198 <https://github.com/ament/ament_cmake/issues/198>\`_)
* Use FindPython3 instead of FindPythonInterp (\`#355 <https://github.com/ament/ament_cmake/issues/355>\`_)
* Update maintainers (\`#336 <https://github.com/ament/ament_cmake/issues/336>\`_)
* Contributors: Chris Lalancette, Shane Loretz, serge-nikulin

1.1.4 (2021-05-06)
------------------

1.1.3 (2021-03-09)
------------------

`;
}

Deno.test("get version from package.xml", () => {
  assertEquals(
    getPackageXmlVersion(getPackageXmlContent(VERSION_STRING)),
    version,
  );
});

Deno.test("throw on no version in package.xml", () => {
  assertThrows(() => {
    getPackageXmlVersion(`<?xml version="1.0"?>`);
  });
});

Deno.test("get version from setup.py", () => {
  assertEquals(
    getSetupPyVersion(getSetupPyContent(VERSION_STRING)),
    version,
  );
});

Deno.test("throw on no version in setup.py", () => {
  assertThrows(() => {
    getSetupPyVersion(`from setuptools import find_packages`);
  });
});

Deno.test("get Version from string", () => {
  assertEquals(
    getVersionFromString(VERSION_STRING),
    version,
  );
});

Deno.test("throws on get bad version from string", () => {
  for (
    const badVersion of [
      "bad version",
      "1",
      "1.",
      "1.0",
      "1.0.",
      ".",
      "..",
      "...",
      "1.0.0.0",
      "1.0.a",
      "1.a.0",
      "a.1.0",
      "1.0.2a",
    ]
  ) {
    assertThrows(
      () => {
        getVersionFromString(badVersion);
      },
      undefined,
      undefined,
      `didn't throw on '${badVersion}'`,
    );
  }
});

Deno.test("get version string", () => {
  assertEquals(
    getVersionString(version),
    VERSION_STRING,
  );
});

Deno.test("bump version", () => {
  const versionString = "1.2.3";
  const version = getVersionFromString(versionString);
  assertEquals(
    bumpVersion(version, "patch"),
    getVersionFromString("1.2.4"),
  );
  assertEquals(
    bumpVersion(version, "minor"),
    getVersionFromString("1.3.0"),
  );
  assertEquals(
    bumpVersion(version, "major"),
    getVersionFromString("2.0.0"),
  );
});

Deno.test("set version in package.xml", () => {
  for (const bumpType of ["patch", "minor", "major"]) {
    const bumpedVersion = bumpVersion(version, bumpType as BumpType);
    assertEquals(
      setPackageXmlVersion(getPackageXmlContent(VERSION_STRING), bumpedVersion),
      getPackageXmlContent(getVersionString(bumpedVersion)),
    );
  }
});

Deno.test("set version in setup.py", () => {
  for (const bumpType of ["patch", "minor", "major"]) {
    const bumpedVersion = bumpVersion(version, bumpType as BumpType);
    assertEquals(
      setSetupPyVersion(getSetupPyContent(VERSION_STRING), bumpedVersion),
      getSetupPyContent(getVersionString(bumpedVersion)),
    );
  }
});

Deno.test("set version in changelog", () => {
  for (const bumpType of ["patch", "minor", "major"]) {
    const bumpedVersion = bumpVersion(version, bumpType as BumpType);
    assertEquals(
      setChangeLogVersion(getUnsetChangelogContent(), bumpedVersion),
      getChangelogContent(getVersionString(bumpedVersion), new Date()),
    );
  }
});

Deno.test("throw on no match in package.xml", () => {
  const bumpedVersion = bumpVersion(version, "patch");
  const badTexts = [
    getSetupPyContent(VERSION_STRING),
    getSetupPyVariableSetContent(VERSION_STRING),
    getUnsetChangelogContent(),
    getChangelogContent(VERSION_STRING, new Date()),
    "not a package.xml file",
  ];
  for (const badText of badTexts) {
    assertThrows(() => {
      setPackageXmlVersion(badText, bumpedVersion);
    });
  }
});

Deno.test("throw on no match in setup.py", () => {
  const bumpedVersion = bumpVersion(version, "patch");
  const badTexts = [
    getPackageXmlContent(VERSION_STRING),
    getSetupPyVariableSetContent(VERSION_STRING),
    getUnsetChangelogContent(),
    getChangelogContent(VERSION_STRING, new Date()),
    "not a setup.py file",
  ];
  for (const badText of badTexts) {
    assertThrows(() => {
      setSetupPyVersion(badText, bumpedVersion);
    });
  }
});

Deno.test("throw on no match in changelog", () => {
  const bumpedVersion = bumpVersion(version, "patch");
  const badTexts = [
    getPackageXmlContent(VERSION_STRING),
    getSetupPyContent(VERSION_STRING),
    getSetupPyVariableSetContent(VERSION_STRING),
    getChangelogContent(VERSION_STRING, new Date()),
    "not a changelog file",
  ];
  for (const badText of badTexts) {
    assertThrows(() => {
      setChangeLogVersion(badText, bumpedVersion);
    });
  }
});

Deno.test("is ros 1 package.xml", () => {
  assert(isRos1File(getRos1PackageXml()));
  assert(!isRos1File(getPackageXmlContent(VERSION_STRING)));

  assert(isRos1File(getRos1SetupPy()));
  assert(!isRos1File(getSetupPyContent(VERSION_STRING)));
});
