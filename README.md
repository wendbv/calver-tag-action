# GitHub Tag using Calendar Versioning

Create a tag using Calendar Versioning, e.g. `v2021.1.0`.

## Inputs

### `prerelease`
If set, tag the version as prerelease - set to e.g. alpha or beta

### `prefix`
**Required** Prefix The name of the person to greet. Default `"v"`.

### `output-only`
Only outputs the new version and don't actually tag the commit


## Outputs

### `version`
The new version

## Example usage
Create a file named `.github/workflows/deploy.yml` in your repo and add the following:

```yml
on: [push]

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v2
      - uses: wendbv/calver-tag-action@v1
```

You can also pass in a prerelease and disable the prefix, this will generate a version like `2021.1.0-beta.0`.
```yml
on: [push]

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v2
      - uses: wendbv/calver-tag-action@v1
        with:
          prerelease: beta
          prefix: ''
```
You can add `output-only` to only output the new version and don't actually tag the commit.
```yml
on: [push]

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v2
      - uses: wendbv/calver-tag-action@v1
        id: tag-version
        with:
          output-only: true
      - name: Get the output version
        run: echo "The new version is was ${{ steps.tag-version.outputs.version }}"
```
