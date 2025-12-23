export default {
  // 前端文件
  'apps/web/**/*.{ts,tsx}': (filenames) => [
    `pnpm --filter web exec eslint --fix ${filenames.join(' ')}`,
  ],

  // 后端文件
  'apps/api/**/*.py': (filenames) => {
    const files = filenames.map((f) => f.replace('apps/api/', '')).join(' ');
    return [
      `bash -c 'cd apps/api && uv run ruff check --fix ${files}'`,
      `bash -c 'cd apps/api && uv run ruff format ${files}'`,
    ];
  },
};
