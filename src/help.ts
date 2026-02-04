import { ErrorCode } from './deploy';

const helpText = `
Official CLI for metacall-deploy

  Usage: metacall-deploy [options]

Authentication Options:
  -e, --email <email>       Email for authentication
  -p, --password <pass>     Password for authentication
  -t, --token <token>       API token for authentication (alternative to email/password)
  -l, --logout              Expire current session

Deployment Options:
  -w, --workdir <path>      Path to application directory (default: current directory)
  -a, --addrepo <url>       Deploy from a Git repository URL
  -n, --projectName <name>  Name for the deployment (default: directory name)
  -P, --plan <plan>         Plan type: "Essential", "Standard", or "Premium"
  -f, --force               Delete existing deployment and redeploy
  --dryRun                  Show what would be deployed without deploying

Environment Variables:
  -E, --env <KEY=VALUE>     Set environment variable (can be repeated)
  --envFile <path>          Load environment variables from file (can be repeated)

File Filtering:
  -I, --ignore <pattern>    Ignore files matching pattern (can be repeated)
                            Examples: -I "*.log" -I "node_modules"

Output Options:
  -q, --quiet               Suppress non-essential output
  -V, --verbose             Show detailed debug output
  --json                    Output results in JSON format (for scripting)
  -i, --inspect [format]    List deployments (Table | Raw | OpenAPIv3)

Management:
  -D, --delete              Interactively select and delete a deployment
  -r, --listPlans           List available subscription plans

Advanced:
  -d, --dev                 Run in dev mode (deploy to local metacall/faas)
  -u, --serverUrl <url>     Override the FaaS base URL
  -c, --confDir <path>      Override the configuration directory

General:
  -v, --version             Show CLI version
  -h, --help                Show this help message

Examples:
  $ metacall-deploy                            Deploy current directory
  $ metacall-deploy -w ./my-app                Deploy specific directory
  $ metacall-deploy -a https://github.com/...  Deploy from repository
  $ metacall-deploy -E DB_HOST=localhost       Deploy with environment variable
  $ metacall-deploy --envFile .env.prod        Deploy with env file
  $ metacall-deploy -I "*.test.js" -I ".git"   Deploy ignoring test files
  $ metacall-deploy --dryRun                   Preview deployment without deploying
  $ metacall-deploy -i                         List all deployments
  $ metacall-deploy -i Raw                     List deployments in raw format
  $ metacall-deploy --json -i                  List deployments as JSON

For more information, visit: https://github.com/metacall/deploy
`;

export const printHelp = (): void => {
	console.log(helpText);
	return process.exit(ErrorCode.Ok);
};
