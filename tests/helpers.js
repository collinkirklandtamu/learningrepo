// Loads the whole platform into Node so lessons can be verified without a browser.
const path = require('path');
globalThis.LP = globalThis.LP || {};
const root = path.join(__dirname, '..', 'js');
for (const f of ['engines/shell.js', 'engines/git.js', 'engines/gh.js', 'engines/docker.js', 'store.js', 'lessons.js', 'md.js', 'ui-common.js', 'engines/python.js', 'engines/r.js']) require(path.join(root, f));
require(path.join(root, 'content', '_helpers.js'));
const CONTENT = require('./content-files.js');
for (const f of CONTENT) {
  try { require(path.join(root, 'content', f + '.js')); } catch (e) { if (e.code !== 'MODULE_NOT_FOUND' || !String(e.message).includes('content/' + f)) throw e; }
}
module.exports = globalThis.LP;
