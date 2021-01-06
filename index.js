// Heavily based on https://github.com/mydea/action-tag-date-version with some changes to the date and added prefix
const { setFailed, getInput, setOutput } = require('@actions/core');
const { context } = require('@actions/github');
const { exec } = require('@actions/exec');
const semver = require('semver');

async function run() {
    try {
        const prerelease = getInput('prerelease', { required: false });
        const prefix = getInput('prefix');
        const outputOnly = getInput('output-only', { required: false }) === 'true';

        const currentVersionTag = await getCurrentTag();

        if (currentVersionTag) {
            console.log(`Already at version ${currentVersionTag}, skipping...`);
            setOutput('version', currentVersionTag);
            return;
        }

        const nextVersion = await getNextVersionTag(prefix, prerelease);

        console.log(`Next version: ${nextVersion}`);

        if (!outputOnly) {
            await exec(`git tag ${nextVersion}`);

            try {
                await execGetOutput(`git push origin ${nextVersion}`);
            } catch (error) {
                const errorMessage = `${error}`;

                if (
                    !errorMessage.includes('reference already exists') &&
                    !errorMessage.includes(
                        'Updates were rejected because the tag already exists in the remote.'
                    ) &&
                    !errorMessage.includes('shallow update not allowed')
                ) {
                    throw error;
                }

                console.log(
                    `It seems the version ${nextVersion} was already created on origin in the meanwhile, skipping...`
                );
            }
        } else {
            console.log(`Only outputting version because output-only is set to ${outputOnly}`);
        }

        setOutput('version', nextVersion);
    } catch (error) {
        setFailed(error.message);
    }
}

run();

async function getCurrentTag() {
    await exec('git fetch --tags -f');

    // First Check if there is already a release tag at the head...
    const currentTags = await execGetOutput(
        `git tag --points-at ${context.sha}`
    );

    return currentTags.map(processVersion).filter(Boolean)[0];
}

async function getNextVersionTag(prefix, prerelease) {
    const allTags = await execGetOutput('git tag');

    const previousVersionTags = allTags
        .map(processVersion)
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b));

    const nextTag = prerelease
        ? getPrereleaseVersion(previousVersionTags, prerelease)
        : getNextDateVersion(previousVersionTags);

    return `${prefix}${nextTag}`;
}

function getNextDateVersion(previousVersionTags) {
    const { year, month } = getDateParts();
    const newVersionParts = [`${year}`, `${month}`, 0];

    while (_tagExists(newVersionParts, previousVersionTags)) {
        newVersionParts[2]++;
    }

    return newVersionParts.join('.');
}

function getPrereleaseVersion(previousVersionTags, prerelease) {
    const nextVersion = getNextDateVersion(previousVersionTags);
    const nextVersionParts = nextVersion.split('.');

    let prereleaseVersion = 0;
    while (
        _tagExists(nextVersionParts, previousVersionTags, [
            prerelease,
            prereleaseVersion,
        ])
    ) {
        prereleaseVersion++;
    }

    return `${nextVersion}-${prerelease}.${prereleaseVersion}`;
}

function _tagExists(tagParts, previousVersionTags, prereleaseParts) {
    let newTag = tagParts.join('.');

    if (prereleaseParts) {
        const [prerelease, prereleaseVersion] = prereleaseParts;
        newTag = `${newTag}-${prerelease}.${prereleaseVersion}`;
    }

    return previousVersionTags.find((tag) => tag === newTag);
}

function processVersion(version) {
    if (!semver.valid(version)) {
        return false;
    }

    const { major, minor, version: parsedVersion } = semver.parse(version);

    const { year: currentYear, month: currentMonth } = getDateParts();

    if (major !== currentYear || minor !== currentMonth) {
        return false;
    }

    return parsedVersion;
}

function getDateParts() {
    const date = new Date();
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth() + 1;

    return { year, month };
}

async function execGetOutput(command) {
    let collectedOutput = [];
    let collectedErrorOutput = [];

    const options = {
        listeners: {
            stdout: (data) => {
                const output = data.toString().split('\n');
                collectedOutput = collectedOutput.concat(output);
            },
            stderr: (data) => {
                const output = data.toString().split('\n');
                collectedErrorOutput = collectedErrorOutput.concat(output);
            },
        },
    };

    try {
        await exec(command, [], options);
    } catch (error) {
        throw new Error(collectedErrorOutput);
    }

    return collectedOutput;
}
