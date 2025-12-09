
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const MODULES_DIR = path.resolve(process.cwd(), 'modules');

const [, , command, ...args] = process.argv;

if (!command) {
    console.log('Usage: tsx scripts/modules.ts <add|remove|update|list> [args]');
    process.exit(1);
}

function ensureModulesDir() {
    if (!fs.existsSync(MODULES_DIR)) {
        fs.mkdirSync(MODULES_DIR, { recursive: true });
    }
}

function addModule(url: string, name?: string) {
    ensureModulesDir();

    // Extract name from URL if not provided
    const moduleName = name || url.split('/').pop()?.replace('.git', '') || 'unknown-module';
    const targetPath = path.join(MODULES_DIR, moduleName);

    if (fs.existsSync(targetPath)) {
        console.error(`Error: Module ${moduleName} already exists.`);
        process.exit(1);
    }

    console.log(`Adding module '${moduleName}' from ${url}...`);
    try {
        execSync(`git clone ${url} ${targetPath}`, { stdio: 'inherit' });
        console.log(`Module ${moduleName} added successfully.`);
    } catch (error) {
        console.error('Failed to add module:', error);
        process.exit(1);
    }
}

function removeModule(name: string) {
    ensureModulesDir();
    const targetPath = path.join(MODULES_DIR, name);

    if (!fs.existsSync(targetPath)) {
        console.error(`Error: Module ${name} does not exist.`);
        process.exit(1);
    }

    console.log(`Removing module '${name}'...`);
    try {
        fs.rmSync(targetPath, { recursive: true, force: true });
        console.log(`Module ${name} removed successfully.`);
    } catch (error) {
        console.error('Failed to remove module:', error);
        process.exit(1);
    }
}

function updateModule(name: string) {
    ensureModulesDir();
    const targetPath = path.join(MODULES_DIR, name);

    if (!fs.existsSync(targetPath)) {
        console.error(`Error: Module ${name} does not exist.`);
        process.exit(1);
    }

    console.log(`Updating module '${name}'...`);
    try {
        execSync('git pull', { cwd: targetPath, stdio: 'inherit' });
        console.log(`Module ${name} updated successfully.`);
    } catch (error) {
        console.error('Failed to update module:', error);
        process.exit(1);
    }
}

function listModules() {
    ensureModulesDir();
    const modules = fs.readdirSync(MODULES_DIR).filter(file => {
        return fs.statSync(path.join(MODULES_DIR, file)).isDirectory();
    });

    if (modules.length === 0) {
        console.log('No modules installed.');
    } else {
        console.log('Installed modules:');
        modules.forEach(m => console.log(`- ${m}`));
    }
}

switch (command) {
    case 'add':
        if (!args[0]) {
            console.error('Usage: add <repo-url> [name]');
            process.exit(1);
        }
        addModule(args[0], args[1]);
        break;
    case 'remove':
        if (!args[0]) {
            console.error('Usage: remove <module-name>');
            process.exit(1);
        }
        removeModule(args[0]);
        break;
    case 'update':
        if (!args[0]) {
            console.error('Usage: update <module-name>');
            process.exit(1);
        }
        updateModule(args[0]);
        break;
    case 'list':
        listModules();
        break;
    default:
        console.error(`Unknown command: ${command}`);
        console.log('Usage: tsx scripts/modules.ts <add|remove|update|list> [args]');
        process.exit(1);
}
