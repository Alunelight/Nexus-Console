// #region agent log
import { writeFileSync } from 'fs';
import path from 'path';
const logPath = '/Users/alune/Documents/code/nexus-console/.cursor/debug.log';
const log = (data) => {
  try {
    writeFileSync(logPath, JSON.stringify({ ...data, timestamp: Date.now(), sessionId: 'debug-session' }) + '\n', { flag: 'a' });
  } catch (e) {}
};
// #endregion

export default {
  // 前端文件
  'apps/web/**/*.{ts,tsx}': (filenames) => [
    `pnpm --filter web exec eslint --fix ${filenames.join(' ')}`,
  ],

  // 后端文件
  'apps/api/**/*.py': (filenames) => {
    // #region agent log
    log({ hypothesisId: 'A', location: '.lintstagedrc.js:15', message: 'filenames received', data: { filenames, count: filenames.length, firstFile: filenames[0] } });
    // #endregion
    
    // #region agent log
    const beforeReplace = filenames.map(f => f);
    log({ hypothesisId: 'B', location: '.lintstagedrc.js:18', message: 'before replace', data: { files: beforeReplace } });
    // #endregion
    
    const files = filenames.map((f) => {
      // #region agent log
      const original = f;
      // #endregion
      
      // 处理绝对路径和相对路径
      let result;
      if (f.startsWith('/')) {
        // 绝对路径：提取 apps/api 之后的部分
        const match = f.match(/apps\/api\/(.+)$/);
        result = match ? match[1] : f.replace(/^.*apps\/api\//, '');
      } else {
        // 相对路径：直接替换前缀
        result = f.replace(/^apps\/api\//, '');
      }
      
      // #region agent log
      log({ hypothesisId: 'C', location: '.lintstagedrc.js:30', message: 'path transformation', data: { original, result, isAbsolute: f.startsWith('/') } });
      // #endregion
      
      return result;
    }).join(' ');
    
    // #region agent log
    log({ hypothesisId: 'D', location: '.lintstagedrc.js:35', message: 'final files string', data: { files, length: files.length } });
    // #endregion
    
    // 将绝对路径转换为相对于 apps/api 的路径
    const repoRoot = process.cwd();
    const apiRoot = path.resolve(repoRoot, 'apps/api');
    const fileList = filenames.map((f) => {
      const absolutePath = f.startsWith('/') ? f : path.resolve(repoRoot, f);
      const relative = path.relative(apiRoot, absolutePath);
      return relative;
    });
    
    // #region agent log
    log({ hypothesisId: 'F', location: '.lintstagedrc.js:57', message: 'file list prepared', data: { fileList, count: fileList.length, firstFile: fileList[0] } });
    // #endregion
    
    // 使用单个命令处理所有文件，避免多次执行
    // 将文件列表用空格连接，ruff 可以处理多个文件
    const filesString = fileList.join(' ');
    
    // #region agent log
    log({ hypothesisId: 'G', location: '.lintstagedrc.js:65', message: 'files string for command', data: { filesString, length: filesString.length } });
    // #endregion
    
    // 使用 pnpm --filter api exec 保证在 apps/api 目录下执行
    const commands = [
      `pnpm --filter api exec -- uv run ruff check --fix ${filesString}`,
      `pnpm --filter api exec -- uv run ruff format ${filesString}`,
    ];
    
    // #region agent log
    log({ hypothesisId: 'E', location: '.lintstagedrc.js:72', message: 'commands generated', data: { commands, commandCount: commands.length, firstCommand: commands[0] } });
    // #endregion
    
    return commands;
  },
};
