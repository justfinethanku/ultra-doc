/** Project data I/O. Plugin code may live elsewhere; data stays under cwd. */
import fs from 'fs';
import path from 'path';

export function createProjectFs(root = process.cwd()) {
  const projectRoot = path.resolve(root);
  const realRoot = fs.realpathSync(projectRoot);
  const rootStat = fs.lstatSync(projectRoot);
  if (rootStat.isSymbolicLink() || !rootStat.isDirectory()) {
    throw new Error(`Unsafe project root: ${projectRoot}`);
  }

  function refuse(target, reason) {
    const error = new Error(`Unsafe project path: ${target} (${reason})`);
    error.code = 'UNSAFE_PROJECT_PATH';
    throw error;
  }

  function inside(base, target) {
    const relative = path.relative(base, target);
    return relative === '' || (!path.isAbsolute(relative) && relative !== '..' && !relative.startsWith(`..${path.sep}`));
  }

  function sameFile(a, b) {
    return a.dev === b.dev && a.ino === b.ino;
  }

  // Check every component, including existing ancestors of a not-yet-created
  // output. Reject even in-root symlinks so enumeration never follows cycles.
  function checkedPath(target, allowMissing = false) {
    if (typeof target !== 'string') throw new TypeError('Project paths must be strings');
    const absolute = path.resolve(projectRoot, target);
    if (!inside(projectRoot, absolute)) refuse(absolute, 'outside project root');
    const currentRoot = fs.lstatSync(projectRoot);
    if (currentRoot.isSymbolicLink() || !sameFile(rootStat, currentRoot) || fs.realpathSync(projectRoot) !== realRoot) {
      refuse(projectRoot, 'project root changed');
    }

    let current = projectRoot;
    let stat = currentRoot;
    const components = path.relative(projectRoot, absolute).split(path.sep).filter(Boolean);
    const ancestors = new Set([`${stat.dev}:${stat.ino}`]);
    for (let index = 0; index < components.length; index++) {
      if (stat && !stat.isDirectory()) refuse(current, 'parent is not a directory');
      current = path.join(current, components[index]);
      try {
        stat = fs.lstatSync(current);
      } catch (error) {
        if (!allowMissing || error.code !== 'ENOENT') throw error;
        stat = null;
        continue;
      }
      if (stat.isSymbolicLink()) refuse(current, 'symlink');
      if (!inside(realRoot, fs.realpathSync(current))) refuse(current, 'real path outside project root');
      if (stat.isDirectory()) {
        const identity = `${stat.dev}:${stat.ino}`;
        if (ancestors.has(identity)) refuse(current, 'directory cycle');
        ancestors.add(identity);
      }
    }
    return { absolute, stat };
  }

  function withFile(target, flags, allowMissing, action) {
    const before = checkedPath(target, allowMissing);
    if (before.stat && !before.stat.isFile()) refuse(target, 'not a regular file');
    // Do not truncate on open: validate the descriptor and path again first.
    // O_EXCL also prevents following a newly inserted link on file creation.
    const create = !before.stat && allowMissing;
    let fd;
    try {
      fd = fs.openSync(before.absolute, flags | (fs.constants.O_NOFOLLOW || 0) |
        (create ? fs.constants.O_CREAT | fs.constants.O_EXCL : 0));
    } catch (error) {
      if (error.code === 'ELOOP') refuse(target, 'symlink detected while opening');
      throw error;
    }
    try {
      const opened = fs.fstatSync(fd);
      const after = checkedPath(target);
      if (!opened.isFile() || !sameFile(opened, after.stat) || (before.stat && !sameFile(opened, before.stat))) {
        refuse(target, 'file changed while opening');
      }
      return action(fd);
    } finally {
      fs.closeSync(fd);
    }
  }

  function readFileSync(target, options = 'utf8') {
    return withFile(target, fs.constants.O_RDONLY, false, fd => fs.readFileSync(fd, options));
  }

  function writeFileSync(target, data, options = 'utf8') {
    return withFile(target, fs.constants.O_WRONLY, true, fd => {
      fs.ftruncateSync(fd, 0);
      fs.writeFileSync(fd, data, options);
    });
  }

  function appendFileSync(target, data, options = 'utf8') {
    return withFile(target, fs.constants.O_WRONLY | fs.constants.O_APPEND, true,
      fd => fs.writeFileSync(fd, data, options));
  }

  function mkdirSync(target, options = {}) {
    const { absolute } = checkedPath(target, true);
    if (!options.recursive) {
      fs.mkdirSync(absolute, options);
      checkedPath(absolute);
      return;
    }
    let current = projectRoot;
    for (const component of path.relative(projectRoot, absolute).split(path.sep).filter(Boolean)) {
      current = path.join(current, component);
      const { stat } = checkedPath(current, true);
      if (!stat) {
        try {
          fs.mkdirSync(current, { mode: options.mode });
        } catch (error) {
          if (error.code !== 'EEXIST') throw error;
        }
      }
      if (!checkedPath(current).stat.isDirectory()) refuse(current, 'not a directory');
    }
  }

  function warn(target, error) {
    console.warn(`Skipping unsafe project entry ${target}: ${error.message}`);
  }

  function isFileSync(target) {
    try {
      return checkedPath(target).stat.isFile();
    } catch (error) {
      if (error.code !== 'ENOENT') warn(target, error);
      return false;
    }
  }

  function readdirSync(target, options = {}) {
    const { absolute, stat } = checkedPath(target);
    if (!stat.isDirectory()) refuse(target, 'not a directory');
    // Dirents plus lstat/realpath validation exclude links (including dangling
    // links), special files and cycles before callers decide what to recurse into.
    const entries = fs.readdirSync(absolute, { withFileTypes: true });
    const safe = entries.filter(entry => {
      const child = path.join(absolute, entry.name);
      try {
        const checked = checkedPath(child).stat;
        if (!checked.isFile() && !checked.isDirectory()) refuse(child, 'not a regular file or directory');
        return true;
      } catch (error) {
        warn(child, error);
        return false;
      }
    });
    return options.withFileTypes ? safe : safe.map(entry => entry.name);
  }

  function statSync(target) {
    return checkedPath(target).stat;
  }

  return { readFileSync, writeFileSync, appendFileSync, mkdirSync, readdirSync, isFileSync, statSync };
}

export default createProjectFs();
