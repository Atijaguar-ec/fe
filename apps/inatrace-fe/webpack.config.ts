import { withModuleFederation } from '@nx/module-federation/angular';
import config from './module-federation.config';

/**
 * DTS Plugin is disabled in Nx Workspaces as Nx already provides Typing support for Module Federation
 * The DTS Plugin can be enabled by setting dts: true
 * Learn more about the DTS Plugin here: https://module-federation.io/configure/dts.html
 */
export default async function (webpackConfig: any, options: any, target: any) {
  const mfFn = await withModuleFederation(config, { dts: false });
  const result = await mfFn(webpackConfig);

  // Fix: "Cannot use 'import.meta' outside a module"
  // Angular DevKit sets output.scriptType = 'module', which causes Webpack to
  // emit import.meta references. Module Federation loads scripts via regular
  // <script> tags (not <script type="module">), so the browser rejects import.meta.
  // Override to 'text/javascript' for compatibility with Module Federation.
  if (result.output) {
    result.output.scriptType = 'text/javascript' as const;
  }

  return result;
}
