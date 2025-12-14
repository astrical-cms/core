/**
 * plugins/config/utils/module-scanner.ts
 *
 * This module provides functionality for scanning and sorting Astrical modules.
 * It discovers modules in the project's modules directory, parses their manifests,
 * and determines the correct execution order based on dependencies.
 * This is crucial for the middleware pipeline to ensure that dependent modules
 * are initialized after their dependencies.
 *
 * Features:
 * - Module discovery via file system scanning
 * - Module manifest (module.yaml) parsing
 * - Dependency graph construction
 * - Topological sorting for execution order
 * - Circular dependency detection
 *
 * Component Integration:
 * - fs: Node.js file system for directory scanning and file reading
 * - path: Node.js path utilities for file path manipulation
 * - js-yaml: YAML parser for module manifests
 * - ModuleManifest: Interface for module configuration
 * - Module: Interface for module metadata
 *
 * Data Flow:
 * 1. Scan modules directory for subdirectories
 * 2. Read and parse module.yaml for each module
 * 3. Construct list of modules with dependencies
 * 4. Perform topological sort on the module list
 * 5. Return sorted list of module names for execution
 *
 * Usage Context:
 * - Build-time configuration generation
 * - middleware.ts execution order determination
 * - Dependency resolution for inter-module communication
 */

import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';

/**
 * ModuleManifest interface defines the structure of a module's configuration file.
 * This corresponds to the content of `module.yaml` in each module directory.
 *
 * @property name - Unique identifier for the module
 * @property dependencies - List of module names that this module depends on
 */
export interface ModuleManifest {
  name: string;
  dependencies?: Array<string>;
}

/**
 * Module interface represents a discovered module in the system.
 * It contains metadata about the module's location and configuration.
 *
 * @property name - Module name (from manifest or directory name)
 * @property path - Absolute file system path to the module directory
 * @property manifest - Parsed configuration from module.yaml, if available
 */
export interface Module {
  name: string;
  path: string;
  manifest?: ModuleManifest;
}

/**
 * Scans the modules directory to discover available modules.
 * Reads `module.yaml` manifests to extract module metadata and dependencies.
 *
 * This function iterates through subdirectories in the given modules path,
 * attempts to parse a `module.yaml` file in each, and constructs a list
 * of `Module` objects. If a manifest is missing or invalid, it falls back
 * to using the directory name as the module name.
 *
 * @param modulesDir - The absolute path to the modules directory to scan
 * @returns An array of Module objects representing the discovered modules
 */
export const scanModules = (modulesDir: string): Array<Module> => {
  if (!fs.existsSync(modulesDir)) {
    return [];
  }

  const modules: Array<Module> = [];
  const entries = fs.readdirSync(modulesDir, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.isDirectory()) {
      const modulePath = path.join(modulesDir, entry.name);
      const manifestPath = path.join(modulePath, 'module.yaml');
      let manifest: ModuleManifest | undefined;

      if (fs.existsSync(manifestPath)) {
        try {
          const content = fs.readFileSync(manifestPath, 'utf-8');
          manifest = yaml.load(content) as ModuleManifest;
        } catch (error) {
          console.warn(`[module-scanner] Failed to parse manifest for module ${entry.name}:`, error);
        }
      }

      // If no manifest, or manifest doesn't specify name, use directory name
      const name = manifest?.name || entry.name;

      modules.push({
        name,
        path: modulePath,
        manifest,
      });
    }
  }

  return modules;
};

/**
 * Topologically sorts modules based on their dependencies.
 *
 * This function implements a Depth-First Search (DFS) topological sort algorithm.
 * It ensures that if Module A depends on Module B, Module B appears before Module A
 * in the returned list. It also detects and reports circular dependencies.
 *
 * Algorithm:
 * 1. Build a map of module names to Module objects for quick lookup.
 * 2. Iterate through each module and perform a recursive visit.
 * 3. Track visited nodes to detect cycles (tempVisited) and completed nodes (visited).
 * 4. For each module, visit its dependencies first.
 * 5. Add the module to the sorted list after all its dependencies are processed.
 *
 * @param modules - The list of discovered modules to sort
 * @returns An array of module names in topological execution order
 */
export const sortModules = (modules: Array<Module>): Array<string> => {
  const moduleMap = new Map<string, Module>();
  const visited = new Set<string>();
  const tempVisited = new Set<string>();
  const sorted: Array<string> = [];
  const cycleDetected = new Set<string>();

  // Index modules by name for quick lookup
  modules.forEach((m) => moduleMap.set(m.name, m));

  const visit = (moduleName: string, path: string[]) => {
    if (cycleDetected.has(moduleName)) return;
    if (tempVisited.has(moduleName)) {
      console.error(`[module-scanner] Circular dependency detected: ${path.join(' -> ')} -> ${moduleName}`);
      cycleDetected.add(moduleName);
      return;
    }
    if (visited.has(moduleName)) return;

    tempVisited.add(moduleName);
    const module = moduleMap.get(moduleName);

    if (module?.manifest?.dependencies) {
      for (const dep of module.manifest.dependencies) {
        // Only visit if the dependency actually exists as a module
        if (moduleMap.has(dep)) {
          visit(dep, [...path, moduleName]);
        }
      }
    }

    tempVisited.delete(moduleName);
    visited.add(moduleName);
    sorted.push(moduleName);
  };

  for (const module of modules) {
    if (!visited.has(module.name)) {
      visit(module.name, []);
    }
  }

  return sorted;
};
