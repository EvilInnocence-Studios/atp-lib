#!/usr/bin/env node

/**
 * Universal Build and Deploy Script for atp packages (atp-geometry and atp-poser)
 *
 * Usage:
 *   node scripts/build-and-deploy.mjs [options]
 *
 * Options:
 *   --package, -p <pkg> Only build/deploy a single package (e.g. "poser", "atp-poser", "geometry", "atp-geometry")
 *   --clean             Remove previous build artifacts and dist/ directories
 *   --test              Run Vitest test suites across target package(s)
 *   --build             Build TypeScript project references (default: true)
 *   --pack              Create npm tarball packages (.tgz) in the release/ directory
 *   --publish           Publish packages to npm registry (in dependency order)
 *   --dry-run           Perform a dry-run of publish/pack without publishing
 *   --link              Register yarn/npm links globally for local development
 *   --copy-to <path>    Copy built dist/ and package.json to a consumer project
 *   --tag <tag>         npm publish tag (default: latest)
 *   --help, -h          Show this help message
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Ordered by dependency: geometry must be built/deployed before poser
const allPackages = [
  {
    name: 'atp-geometry',
    folder: 'geometry',
    dir: path.resolve(rootDir, 'packages', 'geometry'),
  },
  {
    name: 'atp-poser',
    folder: 'poser',
    dir: path.resolve(rootDir, 'packages', 'poser'),
  },
];

// Parse CLI flags
const args = process.argv.slice(2);
const flags = {
  clean: args.includes('--clean'),
  test: args.includes('--test'),
  build: !args.includes('--no-build'),
  pack: args.includes('--pack'),
  publish: args.includes('--publish'),
  dryRun: args.includes('--dry-run'),
  link: args.includes('--link'),
  help: args.includes('--help') || args.includes('-h'),
  copyTo: '',
  tag: 'latest',
  package: '',
};

for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  if ((arg === '--package' || arg === '-p') && args[i + 1]) {
    flags.package = args[i + 1];
    i++;
  } else if (arg.startsWith('--package=')) {
    flags.package = arg.slice('--package='.length);
  } else if (arg.startsWith('-p=')) {
    flags.package = arg.slice('-p='.length);
  }
}

const copyToIdx = args.indexOf('--copy-to');
if (copyToIdx !== -1 && args[copyToIdx + 1]) {
  flags.copyTo = path.resolve(args[copyToIdx + 1]);
}

const tagIdx = args.indexOf('--tag');
if (tagIdx !== -1 && args[tagIdx + 1]) {
  flags.tag = args[tagIdx + 1];
}

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  gray: '\x1b[90m',
};

function log(msg, color = colors.reset) {
  console.log(`${color}${msg}${colors.reset}`);
}

function header(title) {
  console.log('\n' + colors.bold + colors.cyan + '===================================================' + colors.reset);
  console.log(colors.bold + colors.cyan + `  ${title}` + colors.reset);
  console.log(colors.bold + colors.cyan + '===================================================' + colors.reset);
}

function run(command, cmdArgs, cwd = rootDir) {
  const isWindows = process.platform === 'win32';
  const executable = isWindows && !command.endsWith('.cmd') && !command.endsWith('.exe')
    ? `${command}.cmd`
    : command;

  log(`> ${command} ${cmdArgs.join(' ')} (in ${path.relative(rootDir, cwd) || '.'})`, colors.gray);
  const result = spawnSync(executable, cmdArgs, {
    cwd,
    stdio: 'inherit',
    shell: false,
  });

  if (result.error) {
    // If failed, try with shell on Windows
    const fallback = spawnSync(command, cmdArgs, { cwd, stdio: 'inherit', shell: isWindows });
    if (fallback.status !== 0) {
      log(`Error executing ${command}: ${fallback.error || fallback.status}`, colors.red);
      process.exit(fallback.status || 1);
    }
    return;
  }


  if (result.status !== 0) {
    log(`Command failed with exit code ${result.status}`, colors.red);
    process.exit(result.status || 1);
  }
}

if (flags.help) {
  console.log(`
ATP Build and Deploy Script

Usage:
  node scripts/build-and-deploy.mjs [options]

Options:
  --package, -p <pkg> Only build/deploy a single package (e.g. "poser", "atp-poser", "geometry", "atp-geometry")
  --clean             Clean dist/ directories in target package(s)
  --test              Run unit tests across target package(s) before building
  --build             Compile TypeScript package(s) (default)
  --pack              Create tarball packages (.tgz) in release/
  --publish           Publish package(s) to npm registry (respects dependency order)
  --dry-run           Simulate publish or pack without modifying registry
  --link              Register local yarn/npm links globally
  --copy-to <path>    Deploy built package(s) directly to a target project's node_modules
  --tag <tag>         npm tag (default: latest)
  --help, -h          Show this message
`);
  process.exit(0);
}

// Filter packages if --package / -p was specified
let packages = allPackages;
if (flags.package) {
  const target = flags.package.trim().toLowerCase();
  packages = allPackages.filter(
    (pkg) =>
      pkg.name.toLowerCase() === target ||
      pkg.folder.toLowerCase() === target
  );

  if (packages.length === 0) {
    const validList = allPackages.map((p) => `${p.name} (${p.folder})`).join(', ');
    log(`Unknown package "${flags.package}". Available packages: ${validList}`, colors.red);
    process.exit(1);
  }
  log(`Targeting single package: ${packages[0].name}`, colors.cyan);
}

const startTime = Date.now();

// 1. Clean
if (flags.clean) {
  header('Step 1: Cleaning Previous Build Artifacts');
  for (const pkg of packages) {
    const distPath = path.join(pkg.dir, 'dist');
    if (fs.existsSync(distPath)) {
      log(`Cleaning ${path.relative(rootDir, distPath)}...`, colors.yellow);
      fs.rmSync(distPath, { recursive: true, force: true });
    }
  }
  const releaseDir = path.join(rootDir, 'release');
  if (fs.existsSync(releaseDir)) {
    if (!flags.package) {
      log(`Cleaning release/ directory...`, colors.yellow);
      fs.rmSync(releaseDir, { recursive: true, force: true });
    } else {
      // Only remove tarballs belonging to the selected package
      const pkgPrefix = `${packages[0].name}-`;
      for (const file of fs.readdirSync(releaseDir)) {
        if (file.startsWith(pkgPrefix) && file.endsWith('.tgz')) {
          log(`Cleaning release/${file}...`, colors.yellow);
          fs.rmSync(path.join(releaseDir, file), { force: true });
        }
      }
    }
  }
  log('Clean completed.', colors.green);
}

// 2. Test
if (flags.test) {
  header('Step 2: Running Unit Tests');
  for (const pkg of packages) {
    log(`Testing ${pkg.name}...`, colors.cyan);
    run('yarn', ['workspace', pkg.name, 'test']);
  }
  log('All unit tests passed!', colors.green);
}

// 3. Build
if (flags.build) {
  header('Step 3: Compiling TypeScript Packages');
  for (const pkg of packages) {
    // If building atp-poser alone and atp-geometry/dist is missing, build atp-geometry first
    if (pkg.name === 'atp-poser' && !packages.some((p) => p.name === 'atp-geometry')) {
      const geomPkg = allPackages.find((p) => p.name === 'atp-geometry');
      if (geomPkg && !fs.existsSync(path.join(geomPkg.dir, 'dist'))) {
        log(`Prerequisite atp-geometry/dist not found; building ${geomPkg.name} first...`, colors.yellow);
        run('yarn', ['workspace', geomPkg.name, 'build']);
      }
    }

    log(`Building ${pkg.name} (${pkg.folder})...`, colors.cyan);
    run('yarn', ['workspace', pkg.name, 'build']);
    const distPath = path.join(pkg.dir, 'dist');
    if (fs.existsSync(distPath)) {
      const files = fs.readdirSync(distPath);
      log(`  ✓ Built ${pkg.name}: ${files.length} output files/directories generated in dist/`, colors.green);
    }
  }
}

// 4. Pack (Generate .tgz archives)
if (flags.pack) {
  header('Step 4: Packing NPM Tarballs');
  const releaseDir = path.join(rootDir, 'release');
  if (!fs.existsSync(releaseDir)) {
    fs.mkdirSync(releaseDir, { recursive: true });
  }

  for (const pkg of packages) {
    log(`Packing ${pkg.name}...`, colors.cyan);
    const packArgs = ['pack', '--pack-destination', releaseDir];
    if (flags.dryRun) packArgs.push('--dry-run');
    run('npm', packArgs, pkg.dir);
  }
  log(`Tarballs saved to ${releaseDir}`, colors.green);
}

// 5. Register Links (for local development)
if (flags.link) {
  header('Step 5: Registering Local Links');
  for (const pkg of packages) {
    log(`Registering yarn link for ${pkg.name}...`, colors.cyan);
    run('yarn', ['link'], pkg.dir);
  }
  log('Packages linked! You can now run `yarn link atp-geometry` and `yarn link atp-poser` in any consumer app.', colors.green);
}

// 6. Copy to Target Project
if (flags.copyTo) {
  header(`Step 6: Deploying to Target: ${flags.copyTo}`);
  const targetNodeModules = path.join(flags.copyTo, 'node_modules');
  fs.mkdirSync(targetNodeModules, { recursive: true });

  for (const pkg of packages) {
    const pkgTargetDir = path.join(targetNodeModules, pkg.name);
    log(`Deploying ${pkg.name} -> ${pkgTargetDir}...`, colors.cyan);

    // Ensure target dir exists
    if (fs.existsSync(pkgTargetDir)) {
      fs.rmSync(pkgTargetDir, { recursive: true, force: true });
    }
    fs.mkdirSync(pkgTargetDir, { recursive: true });

    // Copy dist, package.json, and README.md
    fs.cpSync(path.join(pkg.dir, 'dist'), path.join(pkgTargetDir, 'dist'), { recursive: true });
    fs.copyFileSync(path.join(pkg.dir, 'package.json'), path.join(pkgTargetDir, 'package.json'));
    if (fs.existsSync(path.join(pkg.dir, 'README.md'))) {
      fs.copyFileSync(path.join(pkg.dir, 'README.md'), path.join(pkgTargetDir, 'README.md'));
    }
    log(`  ✓ Successfully deployed ${pkg.name}`, colors.green);
  }
}

// 7. Publish to Registry
if (flags.publish) {
  header('Step 7: Publishing Packages to NPM Registry');
  for (const pkg of packages) {
    log(`Publishing ${pkg.name} (tag: ${flags.tag})...`, colors.cyan);
    const publishArgs = ['publish', '--access', 'public', '--tag', flags.tag, '--registry', 'https://registry.npmjs.org/'];
    if (flags.dryRun) publishArgs.push('--dry-run');
    run('npm', publishArgs, pkg.dir);
    log(`  ✓ Published ${pkg.name}`, colors.green);
  }
}

const duration = ((Date.now() - startTime) / 1000).toFixed(2);
header(`Build & Deploy Complete in ${duration}s!`);
