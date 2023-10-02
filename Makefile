.PHONY: all
all: build

.PHONY: build
.SILENT: build
build:
	dfx canister create governance
	dfx build

.PHONY: install
.SILENT: install
install: build
	dfx canister install governance

.PHONY: upgrade
.SILENT: upgrade
upgrade: build
	dfx canister install governance --mode=upgrade

.PHONY: clean
.SILENT: clean
clean:
	rm -fr .dfx
