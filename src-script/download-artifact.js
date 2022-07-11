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
const DEFAULT_OWNER = 'project-chip'
const DEFAULT_REPO = 'zap'

async function downloadArtifacts(artifacts, dlOptions) {
  let { directory, auth, owner, repo, branch, commit, platforms } = dlOptions
  console.log(`Downloading artifacts from Github...`)
  console.log(`Directory: ${directory}`)
  console.log(`Repo: https://github.com/${owner}/${repo}`)
  console.log(`Branch: ${branch}`)
  console.log(`Commit: ${commit}`)

  for (const artifact of artifacts) {
    let chunkCount = 0
    const chunkSize = 150

    let { archive_download_url, name } = artifact

    const dlBinary = platforms.reduce(
      (prev, cur) => prev || name.includes(cur),
      false
    )

    if (!dlBinary) {
      continue
    }

    const downloader = new Downloader({
      url: archive_download_url,
      directory: directory,
      maxAttempts: 3,
      headers: {
        'User-Agent': 'Silabs Download Script',
        Authorization: `token ${auth}`,
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
  let { owner, repo, branch, commit, auth } = options
  const octokit = new Octokit({ auth })
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
}

async function main() {
  if (!process.env.GITHUB_TOKEN) {
    return console.error(
      'Missing GITHUB_TOKEN env variable for Github.com access!'
    )
  }

  let y = configureBuildCommand()
  let dlOptions = {
    auth: process.env.GITHUB_TOKEN,
    owner: y.argv.owner,
    repo: y.argv.repo,
    branch: y.argv.branch,
    commit: y.argv.commit,
    directory: y.argv.dir,
    platforms: platforms(y.argv),
  }

  let artifacts = await getArtifacts(dlOptions)
  await downloadArtifacts(artifacts, dlOptions)
}

main()
