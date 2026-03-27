import { ModuleFederationConfig } from '@nx/module-federation';

const config: ModuleFederationConfig = {
  name: 'shrimpMfe',
  exposes: {
    './Module': 'shrimpMfe/src/app/remote-entry/entry.module.ts',
  },
  shared: (libraryName, defaultConfig) => {
    if (libraryName === 'keycloak-angular') {
      return {
        ...defaultConfig,
        singleton: true,
        strictVersion: true,
      };
    }
    return defaultConfig;
  },
};

/**
 * Nx requires a default export of the config to allow correct resolution of the module federation graph.
 **/
export default config;
