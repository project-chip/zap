#!/usr/bin/env node

/**
 *
 *    Copyright (c) 2020 Silicon Labs
 *
 *    Licensed under the Apache License, Version 2.0 (the "License");
 *    you may not use this file except in compliance with the License.
 *    You may obtain a copy of the License at
 *
 *        http://www.apache.org/licenses/LICENSE-2.0
 *
 *    Unless required by applicable law or agreed to in writing, software
 *    distributed under the License is distributed on an "AS IS" BASIS,
 *    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *    See the License for the specific language governing permissions and
 *    limitations under the License.
 */

// This util script downloads ZAP artifact from Github.com
// Usage: node ./download-artifact.js $branch [ $commit | latest ]

const { Octokit, App } = require('octokit')
const { StatusCodes } = require('http-status-codes')
const Downloader = require('nodejs-file-downloader')
const yargs = require('yargs')
const os = require('node:os')

// const
const DEFAULT_COMMIT_LATEST = 'commit_latest'
const DEFAULT_BRANCH = 'master'
const DEFAULT_OWNER = 'SiliconLabs'
const DEFAULT_REPO = 'zap'

async function downloadArtifacts(artifacts, dlOptions) {
  let {
    directory,
    githubToken,
    owner,
    repo,
    branch,
    commit,
    platforms,
    formats,
  } = dlOptions
  console.log(
    `Downloading ZAP artifacts from https://github.com/${owner}/${repo}/tree/${branch}`
  )
  console.log(`Commit: ${commit}`)

  for (const artifact of artifacts) {
    let chunkCount = 0
    const chunkSize = 150

    let { archive_download_url, name } = artifact

    // verify platform
    const verifyPlatform = platforms.reduce(
      (prev, cur) => prev || name.includes(cur),
      false
    )

    const verifyFormat = formats.reduce(
      (prev, cur) => prev || name.endsWith(cur),
      false
    )

    if (!verifyPlatform || !verifyFormat) {
      continue
    }

    const downloader = new Downloader({
      url: archive_download_url,
      directory: directory,
      cloneFiles: false, //This will cause the downloader to re-write an existing file.
      maxAttempts: 3,
      headers: {
        'User-Agent': 'Silabs Download Script',
        Authorization: `token ${githubToken}`,
      },
      onProgress: function (percentage, chunk, remainingSize) {
        chunkCount++
        if (chunkCount > chunkSize) {
          process.stdout.write(`.`)
          chunkCount = 0
        }
      },
    })
    try {
      process.stdout.write(`Downloading ${name}.zip`)
      await downloader.download() //Downloader.download() returns a promise.
      process.stdout.write(`done\n`)
    } catch (error) {
      process.stdout.write(`failed\n`)
      console.error(error)
    }
  }
}

function platforms(argv) {
  let platformMap = { linux: 'linux', win32: 'win', darwin: 'mac' }
  let list = []
  if (argv.linux) {
    list.push('linux')
  }
  if (argv.win) {
    list.push('win')
  }
  if (argv.mac) {
    list.push('mac')
  }
  if (!argv.linux && !argv.win && !argv.mac) {
    list.push(platformMap[os.platform()])
  }
  return list
}
/**
 * Get list of artifacts from Github:
 * @param {*} owner
 * @param {*} repo
 * @param {*} branch
 * @param {*} commit ["latest" | commit_hash_id]
 * @returns list of artifact entries following Github Artifacts schema
 *          https://docs.github.com/en/rest/actions/artifacts
 */
async function getArtifacts(options) {
  let { owner, repo, branch, commit, githubToken } = options
  const octokit = new Octokit({ githubToken })
  let refCommit = ''
  let refWorkflowRunId = ''

  const res = await octokit.request(
    'GET /repos/{owner}/{repo}/actions/artifacts',
    {
      owner,
      repo,
    }
  )

  if (res.status != StatusCodes.OK) {
    console.error('Failed to query Github Artifacts API to download artifacts')
    return []
  }

  let { artifacts } = res.data

  // filter all artifact with current branch
  artifacts = artifacts.filter((e) => e.workflow_run.head_branch === branch)

  if (artifacts?.length) {
    if (commit === DEFAULT_COMMIT_LATEST) {
      refCommit = artifacts[0].workflow_run.head_sha
      options.commit = refCommit
      refWorkflowRunId = artifacts[0].workflow_run.id

      return artifacts.filter(
        (artifact) =>
          artifact.workflow_run.head_branch === branch &&
          artifact.workflow_run.head_sha === refCommit &&
          artifact.workflow_run.id === refWorkflowRunId
      )
    } else {
      refCommit = commit

      let artifacts = artifacts.filter(
        (artifact) =>
          artifact.workflow_run.head_branch === branch &&
          artifact.workflow_run.head_sha === refCommit
      )

      // multiple builds can correspond to the same commit id. always pick the latest build
      if (artifacts.length) {
        refCommit = artifacts[0].workflow_run.id
      }
      return artifacts.filter((e) => e.workflow_run == refCommit)
    }
  }
}

function configureBuildCommand() {
  return yargs
    .option('mac', {
      alias: 'm',
      description: `Build for macOS`,
    })
    .option('linux', {
      alias: 'l',
      description: `Build for Linux`,
    })
    .option('win', {
      alias: 'w',
      description: `Build for Windows`,
    })
    .option('dir', {
      description: 'Output dir',
      default: process.cwd(),
      type: 'string',
    })
    .option('commit', {
      alias: 'c',
      description: `Commit hash for Github artifact`,
      default: DEFAULT_COMMIT_LATEST,
    })
    .option('branch', {
      alias: 'b',
      description: `Commit hash for Github artifact`,
      default: DEFAULT_BRANCH,
    })

    .option('repo', {
      alias: 'r',
      description: 'Name of Github repo: https://github.com/${owner}/${repo}',
      default: DEFAULT_REPO,
    })
    .option('owner', {
      alias: 'o',
      description: 'Owner of Github repo: https://github.com/${owner}/${repo}',
      default: DEFAULT_OWNER,
    })
    .option('githubToken', {
      description: 'Define GITHUB_TOKEN for downloading artifacts from Github',
      default: null,
      type: 'string',
    })
    .option('formats', {
      alias: 'f',
      description: 'Define a list of desired format for artifacts',
      default: ['zip'],
      type: 'array',
    })
    .help('h')
    .alias('h', 'help')
}

async function main() {
  let y = configureBuildCommand()
  let dlOptions = {
    githubToken: y.argv.githubToken
      ? y.argv.githubToken
      : process.env.GITHUB_TOKEN,
    owner: y.argv.owner,
    repo: y.argv.repo,
    branch: y.argv.branch,
    commit: y.argv.commit,
    directory: y.argv.dir,
    platforms: platforms(y.argv),
    formats: y.argv.formats,
  }

  if (!dlOptions.githubToken) {
    return console.error(
      `Missing GITHUB_TOKEN env variable for Github.com access!
Find more information at https://docs.github.com/en/actions/security-guides/automatic-token-authentication#about-the-github_token-secret`
    )
  }

  let artifacts = await getArtifacts(dlOptions)
  await downloadArtifacts(artifacts, dlOptions)
}

main()
