# GitHub Tag using a calendar version

Create a tag using a calendar version, e.g. `v2021.1.0`.

## Inputs

### `prerelease`
If set, tag the version as prerelease - set to e.g. alpha or beta

### `prefix`
**Required** Prefix The name of the person to greet. Default `"v"`.


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
      - uses: actions/checkout@master
      - uses: wendbv/calver-tag-action@v1
```

You can also pass in a prerelease and disable the prefix, this will generate a version like `2021.1.0-beta.0`
```yml
on: [push]

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@master
      - uses: wendbv/calver-tag-action@v1
        with:
          prerelease: 'beta'
          prefix: ''
```
