# TODO

-   [ ] Take a command-line argument to specify project dir (default to cwd)
    -   [ ] Take a command-line flag to specify project type (-t, --type, default to guessing, show list if guess fails)
    -   [ ] Take a command-line flag to specify email (-e, --email)
    -   [ ] Take a command-line flag to specify password (-p, --password)
    -   [ ] Take a command-line flag to specify token (-T, --token)
    -   [ ] Take a command-line flag to specify config dir (-d, --config-dir)
    -   [ ] Take a command-line flag to specify base URL of server (-u, --server-url)
    -   [ ] Take a command-line flag to specify name to deploy as (-n, --project-name, default to dirname)
    -   [ ] Take a command-line flag to specify scripts (comma-separated, default to project type default (main in package.json))
    -   [ ] Take a command-line flag to specify ignore pattern for the bundle (-i, --ignore-pattern, default to project type default)
-   [ ] Figure out how to detect project type
    -   [ ] Only detect if argument wasn't passed
-   [ ] Figure out how to properly zip a folder (Respecting .gitignore? Respecting .npmignore?)
-   [ ] Stream zip file to disk, then read off disk for sending (Can we do this better?)
    -   [ ] Store in config dir?
-   [ ] Figure out what arguments to take in order to generate a named deploy
-   [ ] Figure out how to organize metacall.json generation
-   [ ] Grab version from package.json for node projects?

## Detecting project type

-   Generic language-detection (score-based) based on ratio of files with matching language extensions

-   package.json exists -> node (+50% score)
-   setup.py exists OR requirements.txt exists -> python (+50% score)
-   Gemfile exists OR Rakefile exists OR \*.gemspec exists -> Ruby (+50% score)
-   _.sln exists OR _.csproj exists -> C# (+50% score)

-   show list of languages sorted by score and wait for user input
