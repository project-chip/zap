# Release instructions

This section provides instructions for managing releases on the [ZAP release page](https://github.com/project-chip/zap/releases).

There are two types of prebuilt binaries available: official releases and pre-release releases.

Official releases are built from the `rel` branch and are verified using dedicated Zigbee test suites. Pre-release releases, on the other hand, are built from the `master` branch and are not fully verified as they carry the latest features.

Pushing a tag triggers the release creation CI process, which creates the build and posts it to the release page. The format of the tag name determines whether the release is an official release or a pre-release.

**To create a pre-release, follow these steps:**

1. Checkout the `master` branch:

```bash
$ git checkout master
```

2. Tag the pre-release using the format `vYYYY.MM.DD-nightly` and provide a descriptive message:

```bash
$ git tag -a vYYYY.MM.DD-nightly -m 'Pre-release build from master branch'
```

3. Push the tag to the remote repository:

```bash
$ git push origin vYYYY.MM.DD-nightly
```

**To create an official release, follow these steps:**

1. Checkout the `rel` branch:

```bash
$ git checkout rel
```

2. Tag the release using the format `vYYYY.MM.DD` and provide a descriptive message:

```bash
$ git tag -a vYYYY.MM.DD -m 'ZAP official release vYYYY.MM.DD'
```

3. Push the tag to the remote repository:

```bash
$ git push origin vYYYY.MM.DD
```

# ZAP Versioning and Integration with Matter Repo

The latest ZAP version is always backwards compatible with all Matter releases. To update the Matter repository to the latest ZAP release, follow these steps and merge the changes into Matter's main repository:

## Steps:

1. **Run the version update script:**

```bash
$ ./scripts/run_in_build_env.sh "./scripts/tools/zap/version_update.py --new-version [tagname from release instructions]"
```

2. **Wait for the update to propagate:** After running the script in step 1, it may take 0-6 hours for the updated ZAP release to be available in Matter. You can check the status [here](https://chrome-infra-packages.appspot.com/p/fuchsia/third_party/zap).

3. **Create a PR in the Matter repository:** Once the updated ZAP version is available, create a pull request (PR) in the Matter repository to incorporate the changes from step 1. This allows the main Matter repository to start using the latest ZAP version.
