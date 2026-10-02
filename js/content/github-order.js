(function (root) {
  'use strict';
  const LP = root.LP;
  LP.assemble('github', [
    'gh-remote', 'gh-clone', 'gh-rejected', 'gh-pr', 'gh-review', 'gh-issues', 'gh-protect', 'gh-pr-conflict', 'gh-fork', 'gh-release', 'gh-actions', 'gh-matrix', 'gh-dependabot', 'gh-codeowners', 'gh-capstone',
  ], ['Remotes', 'Collaboration', 'Pull requests', 'Automation', 'Projects']);
})(typeof window !== 'undefined' ? window : globalThis);
