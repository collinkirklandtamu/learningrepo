(function (root) {
  'use strict';
  const LP = root.LP;
  LP.assemble('python', [
    'py-hello', 'py-variables', 'py-numbers', 'py-strings', 'py-functions', 'py-conditions', 'py-loops',
    'py-lists', 'py-tuples-sets', 'py-dicts', 'py-lambda', 'py-iteration', 'py-args', 'py-scope', 'py-mutability',
    'py-recursion', 'py-errors', 'py-files', 'py-stdlib', 'py-collections', 'py-itertools', 'py-regex', 'py-classes', 'py-inheritance', 'py-polymorphism', 'py-composition', 'py-abc', 'py-properties', 'py-dataclasses', 'py-exceptions-custom',
    'py-generators', 'py-decorators', 'py-context', 'py-testing', 'py-typing', 'py-search-sort', 'py-datastructs', 'py-advanced', 'py-capstone',
  ], ['Basics', 'Strings', 'Control flow', 'Functions', 'Data structures', 'Iteration', 'Errors', 'Files & Data', 'Modules', 'OOP', 'Inheritance', 'Algorithms', 'Advanced', 'Projects']);
})(typeof window !== 'undefined' ? window : globalThis);
