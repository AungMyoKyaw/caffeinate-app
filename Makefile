.PHONY: install dev format format-check lint typecheck test test-focus coverage build verify clean tauri-build

install:
	bun install

dev:
	bun run tauri:dev

format:
	bun run format

format-check:
	bun run format:check

lint:
	bun run lint

typecheck:
	bun run typecheck

test:
	bun run test

test-focus:
	bun run test:focus

coverage:
	bun run coverage

build:
	bun run build

verify:
	bun run verify

clean:
	bun run clean

tauri-build:
	bun run tauri:build
