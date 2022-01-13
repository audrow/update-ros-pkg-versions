import {
  bumpVersion,
  getPackageXmlVersion,
  getSetupPyVersion,
  getVersionFromString,
  getVersionString,
  setChangeLogVersion,
  setPackageXmlVersion,
  setSetupPyVersion,
} from "./index.ts";
import { BumpType, Version } from "./types.ts";

import { assertEquals, assertThrows } from "../../deps.test.ts";

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

function getChangelogContent(version: string) {
  const replacementText = version + "\n" + "-".repeat(version.length);

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
      getChangelogContent(getVersionString(bumpedVersion)),
    );
  }
});

Deno.test("throw on no match in package.xml", () => {
  const bumpedVersion = bumpVersion(version, "patch");
  const badTexts = [
    getSetupPyContent(VERSION_STRING),
    getSetupPyVariableSetContent(VERSION_STRING),
    getUnsetChangelogContent(),
    getChangelogContent(VERSION_STRING),
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
    getChangelogContent(VERSION_STRING),
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
    getChangelogContent(VERSION_STRING),
    "not a changelog file",
  ];
  for (const badText of badTexts) {
    assertThrows(() => {
      setChangeLogVersion(badText, bumpedVersion);
    });
  }
});
