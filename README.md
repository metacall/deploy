<p align="center"><a href="https://metacall.io/" target="_blank"><img src="https://github.com/metacall.png" width="28%"></a></p>

<h1 align="center"> <b> MetaCall Faas Deploy </b> </h1>

<p  align="center">Tool for deploying into MetaCall FaaS platform.</p>
<br>

[![NPM](https://img.shields.io/npm/v/@metacall/deploy?color=blue)](https://www.npmjs.com/package/@metacall/deploy)
[![Workflow](https://github.com/metacall/deploy/actions/workflows/ci.yml/badge.svg)](https://github.com/metacall/deploy/actions)
[![install size](https://packagephobia.com/badge?p=@metacall/deploy)](https://packagephobia.com/result?p=@metacall/deploy)
[![discord](https://img.shields.io/discord/781987805974757426?color=purple&style=plastic)](https://discord.com/channels/781987805974757426/)

## Table of Contents

-   [About](#about)
    -   [How to install](#how-to-install)
-   [Supported arguments and commands](#supported-arguments-and-commands)
-   [Getting started](#getting-started)
-   [Exit codes and their meanings](#exit-codes-and-their-meanings)
-   [Contributing and Internal Documentation](#contributing-and-internal-documentation)
-   [Code of Conduct](#contributing-and-internal-documentation)

This tool is not currently working for uploading projects yet, but you can test basic login using the following commands:

```bash
npm i -g @metacall/deploy
metacall-deploy
```

## Configuration

The configuration is stored in: - Unix: `$HOME/.metacall/deploy/config.ini` - Windows: `%APPDATA%\metacall\deploy\config.ini`

## Token

The token is stored in the configuration and can be overwritten at any time with `METACALL_API_KEY` environment variable.

## Contribute

> You Can Directly Start Contributing to this deployer in Cloud with ready to run, build & test the project.

[![Open in Gitpod](https://gitpod.io/button/open-in-gitpod.svg)](https://gitpod.io/#https://github.com/metacall/deploy)

To use it on your forked repo, edit the 'Open in Gitpod' button url to `https://gitpod.io/#https://github.com/<my-github-username>/deploy`
