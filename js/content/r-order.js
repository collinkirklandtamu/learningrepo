(function (root) {
  'use strict';
  const LP = root.LP;
  LP.assemble('r', [
    'r-hello', 'r-vectors', 'r-strings', 'r-stats', 'r-dataframes', 'r-groups', 'r-functions', 'r-iteration', 'r-errors', 'r-io', 'r-s3', 'r-s4', 'r-inference', 'r-lm', 'r-capstone',
  ], ['Basics', 'Vectors', 'Strings', 'Data frames', 'Functions', 'Iteration', 'Errors', 'Dates & IO', 'Inheritance', 'Statistics', 'Projects']);
})(typeof window !== 'undefined' ? window : globalThis);
