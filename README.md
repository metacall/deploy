# MetaCall FaaS Deploy

Tool for deploying into MetaCall FaaS platform.

This tool is not currently working for uploading projects yet, but you can test basic login using the following commands:

```bash
npm i -g metacall-deploy
metacall-deploy
```

## Configuration

The configuration is stored in:
    - Unix: `$HOME/.metacall/config.ini`
    - Windows: `$HOME/_metacall/config.ini`

## Token

The token is stored in the configuration and can be overwritten at any time with `METACALL_API_KEY` environment variable.
