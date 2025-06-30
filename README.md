# ngm - Node Git Manager

Node Git Manager is a simple tool to manage your local Git repositories. It allows you to run batch commands on all your repositories simultaneously.

Featured operations:

- `fetch`: Fetch updates for all registered repositories.
- `pull`: Pull updates for all registered repositories.

Commands for managing registered local repositories:

- `ls`: List all registered repositories.
- `register`: Register a new local Git repository.
- `rm`: Remove a registered repository by its nickname.

## Installation

```bash
npm i -g ngm
pnpm add -g ngm
yarn global add ngm
bun install -g ngm

ngm --help
```

## Uninstallation

```bash
npm rm -g ngm
```

NGM uses [`env-paths`](https://www.npmjs.com/package/env-paths) to determine its local data storage location. To completely remove NGM and its stored data from your system, you can delete the following directories:

```bash
# Linux (per Freedesktop spec)
~/.local/share/ngm-nodejs/

# macOS
~/Library/Application Support/ngm-nodejs/

# Windows
%LOCALAPPDATA%\ngm-nodejs\
```
