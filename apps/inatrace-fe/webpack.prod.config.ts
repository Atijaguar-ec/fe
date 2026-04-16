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
      remotes: [
        // Production remote URL — served from /shrimpMfe/ by the same nginx container
        ['shrimpMfe', '/shrimpMfe/remoteEntry.mjs'],
      ],
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
