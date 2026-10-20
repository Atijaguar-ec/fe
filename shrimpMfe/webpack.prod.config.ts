import { withModuleFederation } from '@nx/module-federation/angular';
import config from './module-federation.config';

/**
 * DTS Plugin is disabled in Nx Workspaces as Nx already provides Typing support for Module Federation
 * The DTS Plugin can be enabled by setting dts: true
 * Learn more about the DTS Plugin here: https://module-federation.io/configure/dts.html
 */
export default async function (webpackConfig: any, options: any, target: any) {
  const mfFn = await withModuleFederation(
    {
      ...config,
      /*
       * Remote overrides for production.
       * Each entry is a pair of a unique name and the URL where it is deployed.
       *
       * e.g.
       * remotes: [
       *   ['app1', 'https://app1.example.com'],
       *   ['app2', 'https://app2.example.com'],
       * ]
       */
    },
    { dts: false },
  );
  const result = await mfFn(webpackConfig);

  // Fix: "Cannot use 'import.meta' outside a module"
  if (result.output) {
    result.output.scriptType = 'text/javascript' as const;
  }

  return result;
}
