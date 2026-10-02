(function (root) {
  'use strict';
  const LP = root.LP;
  LP.assemble('docker', [
    'dk-hello', 'dk-ports', 'dk-lifecycle', 'dk-env-volumes', 'dk-mounts', 'dk-dockerfile', 'dk-build', 'dk-ignore', 'dk-multistage', 'dk-health', 'dk-network',
    'dk-debug', 'dk-limits', 'dk-registry', 'dk-compose', 'dk-compose-adv', 'dk-capstone',
  ], ['Containers', 'Data', 'Images', 'Networking', 'Compose', 'Projects']);
})(typeof window !== 'undefined' ? window : globalThis);
