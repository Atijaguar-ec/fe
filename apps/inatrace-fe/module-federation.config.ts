import { ModuleFederationConfig } from '@nx/module-federation';

const config: ModuleFederationConfig = {
  name: 'inatrace-fe',
  /**
   * To use a remote that does not exist in your current Nx Workspace
   * You can use the tuple-syntax to define your remote
   *
   * remotes: [['my-external-remote', 'https://nx-angular-remote.netlify.app']]
   *
   * You _may_ need to add a `remotes.d.ts` file to your `src/` folder declaring the external remote for tsc, with the
   * following content:
   *
   * declare module 'my-external-remote';
   *
   */
  remotes: ['shrimpMfe'],
  shared: (libraryName, defaultConfig) => {
    if (libraryName === 'keycloak-angular') {
      return {
        ...defaultConfig,
        singleton: true,
        strictVersion: true,
      };
    }
    if (libraryName === '@fortawesome/fontawesome-svg-core') {
      return {
        ...defaultConfig,
        singleton: true,
        strictVersion: false,
      };
    }
    if (libraryName === 'lodash') {
      return false;
    }
    if (libraryName === '@turf/turf') {
      return {
        ...defaultConfig,
        version: '^6.5.0',
        requiredVersion: '^6.5.0',
      };
    }
    if (libraryName === 'maplibre-gl') {
      return {
        ...defaultConfig,
        version: '4.7.0',
        requiredVersion: '^4.7.0',
      };
    }
    return defaultConfig;
  },
};

/**
 * Nx requires a default export of the config to allow correct resolution of the module federation graph.
 **/
export default config;
