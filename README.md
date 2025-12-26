# ngm - Node Git Manager

Node Git Manager is a simple tool to manage your local Git repositories. It allows you to run batch commands on all your repositories simultaneously.

Run batch actions on repos, such as `fetch`, `pull`, `status`, and more.

## Installation

```bash
npm i -g node-git-manager
pnpm add -g node-git-manager
yarn global add node-git-manager
bun install -g node-git-manager

ngm --help
```

### Shellper (shell helper) Setup

Add to shell startup file:

```bash
eval "$(ngm shell)"
alias ']'='ngmcd' # optional alias for quicker use
```

Available shellpers:

```bash
ngmcd <nickname> # automatically changes directory to the target repository
] <nickname> # or whatever alias you configured, if any
```

## Uninstallation

```bash
npm rm -g node-git-manager
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
