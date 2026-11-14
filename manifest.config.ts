import { defineManifest } from '@crxjs/vite-plugin'

export default defineManifest({
  manifest_version: 3,
  name: 'Blindspot',
  version: '0.1.0',
  description: 'Feel what your site is like with a disability, then fix it.',
  icons: { '128': 'public/icons/icon128.png' },
  action: { default_title: 'Open Blindspot' },
  side_panel: { default_path: 'src/sidepanel/index.html' },
  background: { service_worker: 'src/background/index.ts', type: 'module' },
  content_scripts: [
    {
      matches: ['http://*/*', 'https://*/*'],
      js: ['src/content/index.ts'],
      run_at: 'document_idle',
    },
  ],
  permissions: ['sidePanel', 'activeTab', 'scripting', 'tabs'],
  // TODO: Jia replaces this with the real Vercel domain
  host_permissions: ['https://YOUR-APP.vercel.app/*'],
})
