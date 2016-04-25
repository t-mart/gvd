.PHONY: test

test:
	./node_modules/.bin/babel --compact=false --presets='es2015' --plugins='../../lib/index.js' ./test/src --out-dir ./test/out
