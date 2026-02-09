import { Argv } from 'yargs';
import { stdoutWritePlainLn } from '../stdio.ts';

export const command = 'shell';
export const desc = 'Output shell helper functions.';

export const builder = (y: Argv) =>
	y.example('$0 shell', 'Output shell helper functions.');

// SHELLPERCOPY REGION BEGIN
export const shellpers = `# Source this in your shell configuration to enable helper functions for NGM.
#   eval "$(ngm shell)"
#
# The 'ngm shell' command outputs this file's contents to stdout.
#
# Source: https://github.com/ackledotdev/ngm/blob/gitmaster/shellpers.sh

ngmcd() {
	local NICKNAME="$1"
	local REPO_PATH
	REPO_PATH=$(ngm dir "$NICKNAME" -q)
	NGM_STATUS_CODE=$?

	if [ -z "$NICKNAME" ]; then
			echo "ngmcd: No nickname provided." >&2
			return 1
	fi

	if [ -z "$REPO_PATH" ] || [ $NGM_STATUS_CODE -eq 2 ]; then
			echo "ngmcd: No registered repository found with nickname '$NICKNAME'." >&2
			return $NGM_STATUS_CODE
	elif [ ! -e "$REPO_PATH" ] || [ $NGM_STATUS_CODE -eq 3 ]; then
			echo "ngmcd: Repository path '$REPO_PATH' does not exist." >&2
			echo "$REPO_PATH"
			return $NGM_STATUS_CODE
	elif [ ! -d "$REPO_PATH" ]; then
			echo "ngmcd: Repository path '$REPO_PATH' is not a directory." >&2
			return 4
	elif [ $NGM_STATUS_CODE -eq 5 ]; then
			echo "ngmcd: Repository path '$REPO_PATH' does not contain a valid Git repository." >&2
			return $NGM_STATUS_CODE
	fi
	cd "$REPO_PATH" || {
			echo "ngmcd: Failed to change directory to '$REPO_PATH'." >&2
			return 6
	}
}`;
// SHELLPERCOPY REGION END

export const handler = async () => {
	stdoutWritePlainLn(shellpers);
};
