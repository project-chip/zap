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
