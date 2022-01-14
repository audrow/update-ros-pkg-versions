.PHONY: test pretty lint test-all run install uninstall lock

INSTALL_NAME = update-ros-pkg-versions
MAIN_FILE = src/index.ts
LOCK_FILE = lock.json
RUN_PERMISSIONS = --allow-read --allow-write --allow-run

test:
	deno test ${RUN_PERMISSIONS} --unstable

pretty:
	deno fmt

lint:
	deno lint

test-all: test lint
	deno fmt --check

install:
	deno install --force --reload --lock ${LOCK_FILE} ${RUN_PERMISSIONS} --name ${INSTALL_NAME} ${MAIN_FILE}

uninstall:
	deno uninstall ${INSTALL_NAME}

lock:
	deno cache --reload --lock ${LOCK_FILE} --lock-write ${MAIN_FILE}
	make pretty
