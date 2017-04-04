BIN = $(PWD)/node_modules/.bin

build:
	@$(BIN)/babel ./src --out-dir ./lib

build-watch:
	@$(BIN)/babel --watch ./src --out-dir ./lib
