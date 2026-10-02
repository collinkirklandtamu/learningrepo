(function (root) {
  'use strict';
  const LP = root.LP;
  LP.assemble('python', [
    'py-hello', 'py-variables', 'py-strings', 'py-conditions', 'py-loops', 'py-lists', 'py-dicts', 'py-functions', 'py-errors',
    'py-files', 'py-stdlib', 'py-classes', 'py-inheritance', 'py-logging', 'py-testing', 'py-scripts', 'py-capstone',
  ], ['Basics', 'Strings', 'Control flow', 'Functions', 'Data structures', 'Errors', 'Files & Data', 'Modules', 'OOP', 'Inheritance', 'Reliability', 'Projects']);
})(typeof window !== 'undefined' ? window : globalThis);
