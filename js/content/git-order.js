(function (root) {
  'use strict';
  const LP = root.LP;
  LP.assemble('git', [
    'git-setup', 'git-commit', 'git-inspect', 'git-log-filters', 'git-ignore', 'git-branch', 'git-merge', 'git-conflict', 'git-rebase', 'git-cherry-pick',
    'git-undo', 'git-clean', 'git-stash', 'git-reflog', 'git-bisect', 'git-tags', 'git-capstone',
  ], ['Basics', 'Branching', 'Undo', 'History', 'Collaboration', 'Projects']);
})(typeof window !== 'undefined' ? window : globalThis);
