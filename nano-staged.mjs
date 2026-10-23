import { basename, relative } from 'node:path';

// A function config is a single task, so its commands run in order: lint, then format.
// project.json is linted too: a tag change can break a dependent's module boundaries.
const lintable = (file) =>
  /\.(ts|mts|mjs|js|html)$/.test(file) || basename(file) === 'project.json';

export default ({ filenames }) => {
  const lintFiles = filenames.filter(lintable).map((f) => relative(process.cwd(), f));
  return [
    ...(lintFiles.length ? [`nx affected -t lint --fix --files=${lintFiles.join(',')}`] : []),
    `prettier --write --ignore-unknown ${filenames.join(' ')}`,
  ];
};
