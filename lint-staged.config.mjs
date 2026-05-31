import path from 'node:path';

const quote = (value) => `'${value.replaceAll("'", "'\\''")}'`;

const relativePath = (file) => path.relative(process.cwd(), file);

const filesIn = (files, pattern) =>
  files.filter((file) => pattern.test(relativePath(file)));

const eslintCommand = (workspace, files) =>
  files.length > 0
    ? `pnpm --filter ${workspace} exec eslint --fix -- ${files.map(quote).join(' ')}`
    : null;

export default {
  '*': (files) =>
    [
      `prettier --write --ignore-unknown ${files.map(quote).join(' ')}`,
      eslintCommand(
        '@kichulbot/api',
        filesIn(files, /^apps\/api\/(?:src|test)\/.*\.ts$/),
      ),
      eslintCommand(
        '@kichulbot/admin',
        filesIn(files, /^apps\/admin\/.*\.[jt]sx?$/),
      ),
      eslintCommand(
        '@kichulbot/web',
        filesIn(files, /^apps\/web\/.*\.[jt]sx?$/),
      ),
    ].filter(Boolean),
};
