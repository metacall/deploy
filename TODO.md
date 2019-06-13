# TODO

- [ ] Take a command-line argument to specify project dir (default to cwd)
	- [ ] Take a command-line flag to specify project type (--type)
	- [ ] Take a command-line flag to specify config dir (--config-dir)
	- [ ] Take a command-line flag to specify base URL of server (--server-url)
- [ ] Figure out how to detect project type
	- [ ] Only detect if argument wasn't passed
- [ ] Figure out how to properly zip a folder (Respecting .gitignore? Respecting .npmignore?)
- [ ] Stream zip file to disk, then read off disk for sending (Can we do this better?)
	- [ ] Store in config dir?
- [ ] Figure out what arguments to take in order to generate a named deploy
- [ ] Figure out how to organize metacall.json generation

## Detecting project type

- package.json exists -> node
- setup.py exists OR requirements.txt exists -> python
- Gemfile exists OR Rakefile exists OR *.gemspec exists -> Ruby
- *.sln exists OR *.csproj exists -> C#
- else show list of languages and wait for user input
