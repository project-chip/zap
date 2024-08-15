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

import { Octokit } from 'octokit'
import { StatusCodes } from 'http-status-codes'
import Downloader from 'nodejs-file-downloader'
import yargs from 'yargs'
import os from 'node:os'
import isReachable from 'is-reachable'
import axios from 'axios'
import path from 'path'
import fs from 'fs'
import { format, compareAsc, compareDesc, isEqual } from 'date-fns'

// const
const DEBUG = false
const DEFAULT_COMMIT_LATEST = 'commit_latest'
const DEFAULT_BRANCH = 'master'
const DEFAULT_OWNER = 'SiliconLabs'
const DEFAULT_REPO = 'zap'
const ARTIFACTORY_URL_DOMAIN_DEFAULT = 'artifactory.silabs.net'
const ARTIFACTORY_REPO_NAME = 'zap-release-package'
const cachedBranches = ['master', 'rel']

const enum DownloadSources {
  GITHUB = 'github',
  ARTIFACTORY = 'artifactory',
}

// cheap and secure
process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0'

function artifactoryServerUrl(opts: DlOptions) {
  return `https://${opts.artifactoryUrl}`
}

async function artifactoryGetLatestFolder(
  opt: DlOptions,
): Promise<LatestFolder> {
  const { folders, paths } = await artifactoryGetFolders(opt)
  const folder = folders.shift()
  paths.push(folder)
  return { folder, paths }
}

async function artifactoryGetFolders(
  opt: DlOptions,
  uri: string = '',
): Promise<any> {
  const resp = await artifactoryStorageGet(opt, uri)
  const folders = resp?.children
    ?.filter((x: any) => x.folder === true)
    .map((x: any) => x.uri)

  // folder names are Date formats. Sort them.
  const dateRegex = new RegExp(`/([^\\/]*)/`)
  folders.sort((a: string, b: string) => {
    // sort entries via 'path' key
    // e.g. path: 'SiliconLabs/zap/master/2022-07-22T14:55:43Z/zap-win-zip.json'
    // let boo = a?.match(dateRegex)
    if (a.startsWith('/')) {
      a = a.substring(1)
    }
    if (b.startsWith('/')) {
      b = b.substring(1)
    }

    let dateA = new Date(a)
    let dateB = new Date(b)
    if (isEqual(dateA, dateB)) {
      return b.localeCompare(a)
    } else {
      return compareDesc(dateA, dateB)
    }
  })
  return { folders, paths: [resp?.uri] }
}

async function artifactoryStorageGet(
  dlOptions: DlOptions,
  uri: string = '',
): Promise<any> {
  const url = `${artifactoryServerUrl(
    dlOptions,
  )}/artifactory/api/storage/gsdk-generic-production/${ARTIFACTORY_REPO_NAME}/${
    dlOptions.owner
  }/${dlOptions.repo}/${dlOptions.branch}/${uri}`
  return httpGet(url)
}

async function artifactoryGetContent(paths: string[]): Promise<string[]> {
  const resp = await httpGet(paths.join(''))
  const files = resp?.children.map((x: any) => x.uri)
  return files
}

async function httpGet(url: string) {
  try {
    if (DEBUG) console.log(`GET: ${url}`)
    let resp = await axios.get(url)
    return resp.data
  } catch (err) {
    console.error(err)
    return []
  }
}

function verifyPlatformAndFormat(
  name: string,
  platforms: string[],
  formats: string[],
) {
  // verify platform
  const verifyPlatform = platforms.reduce(
    (prev, cur) => prev || name.includes(cur),
    false,
  )

  const verifyFormat = formats.reduce(
    (prev, cur) => prev || name.endsWith(cur),
    false,
  )

  if (!verifyPlatform || !verifyFormat) {
    return false
  }

  return true
}

async function githubDownloadArtifacts(
  artifacts: any,
  dlOptions: DlOptions,
  verifyPlatformAndFormat: Function,
) {
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
    `Commit: https://github.com/${owner}/${repo}/commit/${commit?.substring(
      0,
      7,
    )}`,
  )

  if (artifacts.length) {
    if (dlOptions.mirror) {
      outputDir = path.join(
        outputDir,
        'artifacts',
        dlOptions.branch,
        artifacts[0].created_at,
      )
    }

    console.log(`Output directory: ${outputDir}`)
    for (const artifact of artifacts) {
      let { archive_download_url, name, created_at, size_in_bytes } = artifact
      if (!verifyPlatformAndFormat.call(null, name, platforms, formats)) {
        continue
      }

      await download(
        archive_download_url,
        outputDir,
        githubToken,
        `${name}.zip`,
      )

      // download metadata file.
      try {
        fs.writeFileSync(
          path.join(outputDir, `${name}.json`),
          JSON.stringify(artifact, null, 4),
        )
      } catch (err) {
        console.error(err)
      }
    }
  }
}

async function githubListArtifacts(
  artifacts: any,
  dlOptions: DlOptions,
  verifyPlatformAndFormat: Function,
) {
  let { branch, outputDir, platforms, formats } = dlOptions

  if (artifacts.length == 0) {
    return
  }

  if (artifacts.length) {
    if (dlOptions.mirror) {
      outputDir = path.join(outputDir, 'artifacts')
    }

    let artifactsList: string[] = []
    for (const artifact of artifacts) {
      let { name } = artifact
      if (!verifyPlatformAndFormat.call(null, name, platforms, formats)) {
        continue
      }

      let artifactPath = path.join(
        branch,
        artifacts[0].created_at,
        `${name}.zip`,
      )

      if (DEBUG) console.log(`${artifactPath}`)
      artifactsList.push(artifactPath)
    }
    try {
      // in case branch names have slashes (feature/branchName)
      let dir = path.dirname(path.join(outputDir, `${branch}.txt`))

      fs.mkdirSync(dir, { recursive: true })
      fs.writeFileSync(
        path.join(outputDir, `${branch}.txt`),
        artifactsList.join('\n'),
      )
    } catch (err) {
      console.error(err)
    }
  }
}

async function download(
  archive_download_url: string,
  outDir: string,
  githubToken: string | undefined,
  name: string,
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
    process.stdout.write(`Downloading ${path.basename(name)}...`)
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

async function getExistingGithubBranches(
  options: DlOptions,
): Promise<string[]> {
  const url = `https://api.github.com/repos/${options.owner}/${options.repo}/branches`
  let branches = []

  try {
    if (DEBUG) console.log(`GET: ${url}`)
    let resp = await axios.get(url)
    branches = resp?.data?.map((x: any) => x.name)
  } catch (error) {
    console.error(error)
  }

  return branches
}

async function artifactoryDownloadArtifacts(
  latest: LatestFolder,
  dlOptions: DlOptions,
  verifyPlatformAndFormat: Function,
) {
  let { owner, repo, branch, outputDir, platforms, formats } = dlOptions

  if (latest != null) {
    // print commit infos
    let files = await artifactoryGetContent(latest.paths)
    let json = files.filter((x) => x.toLowerCase().endsWith('.json'))?.shift()
    let artifacts = files.filter((x) => !x.toLowerCase().endsWith('.json'))

    if (json && artifacts && artifacts.length > 0) {
      let baseUri = latest.paths.join('').replace('/api/storage', '')
      baseUri = baseUri.replace(
        ARTIFACTORY_URL_DOMAIN_DEFAULT,
        dlOptions.artifactoryUrl,
      )
      console.log(`Repo: ${baseUri}`)
      const jsonContent = await httpGet(baseUri + json)
      console.log(
        `Commit: ${jsonContent.workflow_run.head_sha.substring(0, 7)}`,
      )
      console.log(`Output directory: ${outputDir}`)

      for (const artifact of [json, ...artifacts]) {
        let downloadUrl = baseUri + artifact

        // download .json from Artifactory as well.
        // This is needed by internal CI to track zap version across builds.
        if (
          !verifyPlatformAndFormat.call(null, artifact, platforms, [
            ...formats,
            '.json',
          ])
        ) {
          continue
        }
        await download(downloadUrl, outputDir, undefined, artifact)
      }
    }
  } else {
    console.log(`No artifacts were found!`)
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
  const octokit = new Octokit({
    githubToken,
  })
  let refCommit: string | undefined = ''
  let refWorkflowRunId: number | undefined = 0

  const res = await octokit.request(
    'GET /repos/{owner}/{repo}/actions/artifacts',
    {
      owner,
      repo,
    },
  )

  if (res.status != StatusCodes.OK) {
    console.error('Failed to query Github Artifacts API to download artifacts')
    return []
  }

  let { artifacts } = res.data

  // filter all artifact with current branch
  artifacts = artifacts?.filter(
    (e: any) => e.workflow_run.head_branch === branch,
  )

  if (artifacts && artifacts.length) {
    if (commit === DEFAULT_COMMIT_LATEST) {
      refCommit = artifacts[0]?.workflow_run?.head_sha
      options.commit = refCommit
      refWorkflowRunId = artifacts[0]?.workflow_run?.id

      return artifacts.filter(
        (artifact: any) =>
          artifact.workflow_run.head_sha === refCommit &&
          artifact.workflow_run.id === refWorkflowRunId,
      )
    } else {
      refCommit = commit

      artifacts = artifacts?.filter((artifact: any) =>
        artifact.workflow_run.head_sha.startsWith(refCommit),
      )

      // multiple builds can correspond to the same commit id
      // always pick artifacts with the latest run (newest run "id")
      if (artifacts?.length) {
        refWorkflowRunId = artifacts[0]?.workflow_run?.id
        artifacts = artifacts.filter(
          (artifact: any) => artifact.workflow_run.id == refWorkflowRunId,
        )
      }

      return [...artifacts]
    }
  } else {
    console.error('Unable to find any artifacts for download.')
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
      description: `Download Github artifacts into ./artifacts folder to simplify Artifactory upload process.`,
      type: 'boolean',
      default: false,
    })
    .option('nameOnly', {
      description: `Output list of latest artifacts to <branch_name>.txt. Used for verifying the presence on Artifactory`,
      type: 'boolean',
      default: false,
    })
    .option('src', {
      description: `URL source for obtaining ZAP binaries`,
      type: 'string',
      default: DownloadSources.ARTIFACTORY,
      choices: [DownloadSources.GITHUB, DownloadSources.ARTIFACTORY],
    })
    .option('artifactoryUrl', {
      description: `Specify Artifactory URL domain used for downloading binaries from the artifact repo`,
      type: 'string',
      default: ARTIFACTORY_URL_DOMAIN_DEFAULT,
    })
    .help('h')
    .alias('h', 'help')
}

interface LatestFolder {
  folder: string
  paths: string[]
}

interface DlOptions {
  githubToken?: string
  owner: string
  repo: string
  branch: string
  commit: string | undefined
  outputDir: string
  platforms: string[]
  formats: string[]
  src: string
  mirror: boolean
  nameOnly: boolean
  artifactoryUrl: string
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
    nameOnly: y.argv.nameOnly,
    artifactoryUrl: y.argv.artifactoryUrl,
  }

  let githubBranches = await getExistingGithubBranches(dlOptions)

  // evaluate artifact source
  if (dlOptions.src === DownloadSources.ARTIFACTORY) {
    if (
      !(await isReachable(artifactoryServerUrl(dlOptions), { timeout: 10000 }))
    ) {
      console.log(
        `Unable to reach Artifactory server (${artifactoryServerUrl(
          dlOptions,
        )}). Defaulting to Github instead.`,
      )
      dlOptions.src = DownloadSources.GITHUB
    } else if (
      githubBranches.includes(dlOptions.branch) &&
      !cachedBranches.includes(dlOptions.branch)
    ) {
      console.log(
        `Branch ${dlOptions.branch} is not cached on Artifactory. Defaulting to Github instead.`,
      )
      dlOptions.src = DownloadSources.GITHUB
    } else if (!cachedBranches.includes(dlOptions.branch)) {
      console.log(
        `Branch ${dlOptions.branch} is not cached on Artifactory. Defaulting to master branch instead.`,
      )
      dlOptions.branch = 'master'
    }
  }

  // Download site sources: Artifactory, Github
  if (dlOptions.src === DownloadSources.ARTIFACTORY) {
    let latest = await artifactoryGetLatestFolder(dlOptions)
    await artifactoryDownloadArtifacts(
      latest,
      dlOptions,
      verifyPlatformAndFormat,
    )
  } else {
    if (!dlOptions.githubToken) {
      return console.error(
        `Missing GITHUB_TOKEN env variable for Github.com access!
Find more information at https://docs.github.com/en/actions/security-guides/automatic-token-authentication#about-the-github_token-secret`,
      )
    }

    let artifacts = await githubGetArtifacts(dlOptions)
    if (dlOptions.nameOnly) {
      await githubListArtifacts(artifacts, dlOptions, verifyPlatformAndFormat)
    } else {
      await githubDownloadArtifacts(
        artifacts,
        dlOptions,
        verifyPlatformAndFormat,
      )
    }
  }
}

main()
