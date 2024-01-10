PATH := node_modules/.bin:$(PATH)

.PHONY: ts clean

all: ts html

dist:
	shx mkdir -p dist

ts: dist
	tsc
	esbuild ./js/index.js --bundle --sourcemap --sources-content=false --outfile=./dist/index.js

html: dist
	shx cp -r src/html/* dist

clean:
	shx rm -rf js
	shx rm -rf dist