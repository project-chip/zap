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
const isReachable = require('is-reachable')
const axios = require('axios').default
const path = require('path')
const fs = require('fs')
const { format, compareAsc, compareDesc, isEqual } = require('date-fns')
const DEBUG = false

// const
const DEFAULT_COMMIT_LATEST = 'commit_latest'
const DEFAULT_BRANCH = 'master'
const DEFAULT_OWNER = 'SiliconLabs'
const DEFAULT_REPO = 'zap'
const NEXUS_SERVER = 'https://nexus.silabs.com'
const NEXUS_REPO_NAME = 'test-binary-archiver'

// cheap and secure
process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0'

function nexusRestApiUrl(repository: string, nameFilter: string): string {
  return `${NEXUS_SERVER}/service/rest/v1/search/assets?repository=${repository}&name=${nameFilter}`
}

async function urlContent(url: string) {
  let resp = await axios.get(url)
  return resp.data
}

async function githubDownloadArtifacts(artifacts: any, dlOptions: DlOptions) {
  let {
    outputDir,
    githubToken,
    owner,
    repo,
    branch,
    commit,
    platforms,
    formats,
  } = dlOptions

  if (artifacts.length == 0) {
    return
  }

  console.log(`Repo: https://github.com/${owner}/${repo}/tree/${branch}`)
  console.log(
    `Commit: https://github.com/${owner}/${repo}/commit/${commit.substring(
      0,
      7
    )}`
  )

  if (artifacts.length) {
    if (dlOptions.mirror) {
      outputDir = path.join(
        outputDir,
        'artifacts',
        dlOptions.branch,
        artifacts[0].created_at
      )
    }

    console.log(`Output directory: ${outputDir}`)
    for (const artifact of artifacts) {
      let { archive_download_url, name, created_at, size_in_bytes } = artifact

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

      await download(
        archive_download_url,
        outputDir,
        githubToken,
        `${name}.zip`
      )

      // download metadata file.
      try {
        fs.writeFileSync(
          path.join(outputDir, `${name}.json`),
          JSON.stringify(artifact, null, 4)
        )
      } catch (err) {
        console.error(err)
      }
    }
  }
}

async function download(
  archive_download_url: string,
  outDir: string,
  githubToken: string | undefined,
  name: string
) {
  let chunkCount = 0
  const chunkSize = 200
  const downloader = new Downloader({
    url: archive_download_url,
    directory: outDir,
    cloneFiles: false,
    maxAttempts: 3,
    headers: {
      'User-Agent': 'Silabs Download Script',
      Authorization: `token ${githubToken}`,
    },
    onProgress: function (percentage: any, chunk: any, remainingSize: any) {
      chunkCount++
      if (chunkCount > chunkSize) {
        process.stdout.write(`.`)
        chunkCount = 0
      }
    },
  })
  try {
    process.stdout.write(`Downloading ${name}...`)
    await downloader.download() //Downloader.download() returns a promise.
    process.stdout.write(`done\n`)
  } catch (error) {
    process.stdout.write(`failed\n`)
    console.error(error)
  }
}

function platforms(argv: any) {
  let platformMap: { [index: string]: any } = {
    linux: 'linux',
    win32: 'win',
    darwin: 'mac',
  }
  let list: string[] = []
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

async function nexusGetArtifacts(url: string, options: DlOptions) {
  let accumulatedItems: any[] = []
  let continuationToken = ''

  try {
    if (DEBUG) console.log(`GET: ${url}`)
    let resp = await axios.get(url)
    accumulatedItems = accumulatedItems.concat(resp?.data?.items)
    continuationToken = resp?.data?.continuationToken

    do {
      let url
      if (continuationToken) {
        url = url + `&continuationToken=${continuationToken}`
      } else {
        break
      }
      if (DEBUG) console.log(`GET: ${url}`)
      resp = await axios.get(url)
      accumulatedItems = accumulatedItems.concat(resp?.data?.items)
      continuationToken = resp?.data?.continuationToken
    } while (continuationToken)
  } catch (error) {
    console.error(error)
  }

  return accumulatedItems
}

async function nexusDownloadArtifacts(items: any, dlOptions: DlOptions) {
  let { owner, repo, branch, outputDir, platforms, formats } = dlOptions
  console.log(
    `Repo: ${NEXUS_SERVER}/#browse/browse:${NEXUS_REPO_NAME}:${dlOptions.owner}/${dlOptions.repo}/${dlOptions.branch}`
  )

  // item example:
  //   {
  //     "downloadUrl": "https://nexus.silabs.com/repository/test-binary-archiver/SiliconLabs/zap/master/2022-07-22T14:55:43Z/zap-win-zip.json",
  //     "path": "SiliconLabs/zap/master/2022-07-22T14:55:43Z/zap-win-zip.json",
  //     "id": "dGVzdC1iaW5hcnktYXJjaGl2ZXI6MDdlMDJlZWI1YWQ0NjIxMmZlYjYzYTFjMWUxZmEwYjI",
  //     "repository": "test-binary-archiver",
  //     "format": "raw",
  //     "checksum": {
  //         "sha1": "cbe61be0fa7a962430d061c2490b1b1806f780fd",
  //         "md5": "472fe10e53c9a084341a3d1ba27aa8c5"
  //     },
  //     "contentType": "application/json",
  //     "lastModified": "2022-07-22T16:59:49.675+00:00"
  // },

  // find folder name with newest date and download content
  const dateRegex = new RegExp(`${owner}/${repo}/${branch}/([^\/]*)`)
  items.sort((a: any, b: any) => {
    // sort entries via 'path' key
    // e.g. path: 'SiliconLabs/zap/master/2022-07-22T14:55:43Z/zap-win-zip.json'
    let res = a?.path?.match(dateRegex)
    let dateA = new Date(a?.path?.match(dateRegex)[1])
    let dateB = new Date(b?.path?.match(dateRegex)[1])
    if (isEqual(dateA, dateB)) {
      return b.path.localeCompare(a.path)
    } else {
      return compareDesc(dateA, dateB)
    }
  })

  if (items.length > 1) {
    let date = items[0].path.match(dateRegex)[1]

    let artifacts = await nexusGetArtifacts(
      nexusRestApiUrl(
        NEXUS_REPO_NAME,
        `${dlOptions.owner}/${dlOptions.repo}/${dlOptions.branch}/${date}/*`
      ),
      dlOptions
    )

    // find commit
    let jsonFiles = artifacts.filter((x) =>
      x.contentType.toLowerCase().includes('json')
    )

    let jsonContent = await urlContent(jsonFiles.shift().downloadUrl)
    console.log(`Commit: ${jsonContent.workflow_run.head_sha.substring(0, 7)}`)
    console.log(`Output directory: ${outputDir}`)

    for (const artifact of artifacts) {
      let { downloadUrl } = artifact
      let name = downloadUrl.substring(downloadUrl.lastIndexOf('/') + 1)
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

      await download(artifact.downloadUrl, outputDir, undefined, name)
    }
  }
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
async function githubGetArtifacts(options: DlOptions) {
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
  artifacts = artifacts?.filter(
    (e: any) => e.workflow_run.head_branch === branch
  )

  if (artifacts && artifacts.length) {
    if (commit === DEFAULT_COMMIT_LATEST) {
      refCommit = artifacts[0].workflow_run.head_sha
      options.commit = refCommit
      refWorkflowRunId = artifacts[0].workflow_run.id

      return artifacts.filter(
        (artifact: any) =>
          artifact.workflow_run.head_sha === refCommit &&
          artifact.workflow_run.id === refWorkflowRunId
      )
    } else {
      refCommit = commit

      artifacts = artifacts?.filter((artifact: any) =>
        artifact.workflow_run.head_sha.startsWith(refCommit)
      )

      // multiple builds can correspond to the same commit id
      // always pick artifacts with the latest run (newest run "id")
      if (artifacts?.length) {
        refWorkflowRunId = artifacts[0].workflow_run.id
        artifacts = artifacts.filter(
          (artifact: any) => artifact.workflow_run.id == refWorkflowRunId
        )
      }

      return [].concat(artifacts)
    }
  } else {
    console.error('Unable to retrieve any artifacts for download.')
    return []
  }
}

function configureBuildCommand() {
  return yargs
    .option('mac', {
      alias: 'm',
      description: `Download macOS artifacts`,
    })
    .option('linux', {
      alias: 'l',
      description: `Download Linux artifacts`,
    })
    .option('win', {
      alias: 'w',
      description: `Download Windows artifacts`,
    })
    .option('outputDir', {
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
    .option('mirror', {
      description: `Download Github artifacts into ./artifacts folder to simplify Nexus upload process.`,
      type: 'boolean',
      default: false,
    })
    .option('src', {
      description: `URL source for obtaining ZAP binaries`,
      type: 'string',
      default: 'nexus',
      choices: ['github', 'nexus'],
    })
    .help('h')
    .alias('h', 'help')
}

interface DlOptions {
  githubToken?: string
  owner: string
  repo: string
  branch: string
  commit: string
  outputDir: string
  platforms: string[]
  formats: string[]
  src: string
  mirror: boolean
}

async function main() {
  let y = configureBuildCommand()
  let dlOptions: DlOptions = {
    githubToken: y.argv.githubToken
      ? y.argv.githubToken
      : process.env.GITHUB_TOKEN,
    owner: y.argv.owner,
    repo: y.argv.repo,
    branch: y.argv.branch,
    commit: y.argv.commit,
    outputDir: y.argv.outputDir,
    platforms: platforms(y.argv),
    formats: y.argv.formats,
    src: y.argv.src,
    mirror: y.argv.mirror,
  }

  // Download site sources: Nexus, Github
  if (dlOptions.src === 'nexus' && (await isReachable(NEXUS_SERVER))) {
    const nexusUrl = nexusRestApiUrl(
      NEXUS_REPO_NAME,
      `${dlOptions.owner}/${dlOptions.repo}/${dlOptions.branch}/*`
    )

    let nexusItems = await nexusGetArtifacts(nexusUrl, dlOptions)
    await nexusDownloadArtifacts(nexusItems, dlOptions)
  } else {
    if (!dlOptions.githubToken) {
      return console.error(
        `Missing GITHUB_TOKEN env variable for Github.com access!
Find more information at https://docs.github.com/en/actions/security-guides/automatic-token-authentication#about-the-github_token-secret`
      )
    }

    let artifacts = await githubGetArtifacts(dlOptions)
    await githubDownloadArtifacts(artifacts, dlOptions)
  }
}

main()
