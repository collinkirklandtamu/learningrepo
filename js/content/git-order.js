(function (root) {
  'use strict';
  const LP = root.LP;
  LP.assemble('git', [
    'git-setup', 'git-commit', 'git-inspect', 'git-ignore', 'git-branch', 'git-merge', 'git-conflict', 'git-rebase', 'git-undo', 'git-stash', 'git-reflog', 'git-capstone',
  ], ['Basics', 'Branching', 'Undo', 'History', 'Projects']);
})(typeof window !== 'undefined' ? window : globalThis);
