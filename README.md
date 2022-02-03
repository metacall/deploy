# MetaCall FaaS Deploy

Tool for deploying into MetaCall FaaS platform.

This tool is not currently working for uploading projects yet, but you can test basic login using the following commands:

```bash
npm i -g metacall-deploy
metacall-deploy
```

## Configuration

The configuration is stored in:
    - Unix: `$HOME/.metacall/deploy/config.ini`
    - Windows: `%APPDATA%\metacall\deploy\config.ini`

## Token

The token is stored in the configuration and can be overwritten at any time with `METACALL_API_KEY` environment variable.

## Contribute

> You Can Directly Start Contributing to this deployer in Cloud with ready to run, build & test the project.

[![Open in Gitpod](https://gitpod.io/button/open-in-gitpod.svg)](https://gitpod.io/#https://github.com/metacall/deploy)

To use it on your forked repo, edit the 'Open in Gitpod' button url to `https://gitpod.io/#https://github.com/<my-github-username>/deploy`
