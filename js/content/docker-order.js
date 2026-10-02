(function (root) {
  'use strict';
  const LP = root.LP;
  LP.assemble('docker', [
    'dk-hello', 'dk-ports', 'dk-lifecycle', 'dk-env-volumes', 'dk-dockerfile', 'dk-build', 'dk-health', 'dk-debug', 'dk-limits', 'dk-network', 'dk-compose', 'dk-capstone',
  ], ['Containers', 'Data', 'Images', 'Networking', 'Compose', 'Projects']);
})(typeof window !== 'undefined' ? window : globalThis);
