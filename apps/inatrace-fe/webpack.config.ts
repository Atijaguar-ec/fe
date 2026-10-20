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

  // Silence Sass deprecation warnings from dependencies and local files
  if (result.module && result.module.rules) {
    const silenceSassWarnings = (rules: any[]) => {
      if (!rules) return;
      for (const rule of rules) {
        if (rule.loader && rule.loader.includes('sass-loader')) {
          console.log('Found sass-loader rule:', rule);
          rule.options = rule.options || {};
          rule.options.sassOptions = rule.options.sassOptions || {};
          rule.options.sassOptions.quietDeps = true;
          rule.options.sassOptions.logger = { warn: () => {}, debug: () => {} };
        }
        if (rule.use) {
          if (Array.isArray(rule.use)) {
            for (let i = 0; i < rule.use.length; i++) {
              let useEntry = rule.use[i];
              if (typeof useEntry === 'string' && useEntry.includes('sass-loader')) {
                console.log('Found sass-loader string use:', useEntry);
                rule.use[i] = {
                  loader: useEntry,
                  options: {
                    sassOptions: {
                      quietDeps: true,
                      logger: { warn: () => {}, debug: () => {} }
                    }
                  }
                };
              } else if (useEntry && typeof useEntry === 'object' && useEntry.loader && useEntry.loader.includes('sass-loader')) {
                console.log('Found sass-loader object use:', useEntry);
                useEntry.options = useEntry.options || {};
                useEntry.options.sassOptions = useEntry.options.sassOptions || {};
                useEntry.options.sassOptions.quietDeps = true;
                useEntry.options.sassOptions.logger = { warn: () => {}, debug: () => {} };
              }
            }
          } else if (typeof rule.use === 'string' && rule.use.includes('sass-loader')) {
            console.log('Found sass-loader string single use:', rule.use);
            rule.use = {
              loader: rule.use,
              options: {
                sassOptions: {
                  quietDeps: true,
                  logger: { warn: () => {}, debug: () => {} }
                }
              }
            };
          } else if (typeof rule.use === 'object' && rule.use.loader && rule.use.loader.includes('sass-loader')) {
            console.log('Found sass-loader object single use:', rule.use);
            rule.use.options = rule.use.options || {};
            rule.use.options.sassOptions = rule.use.options.sassOptions || {};
            rule.use.options.sassOptions.quietDeps = true;
            rule.use.options.sassOptions.logger = { warn: () => {}, debug: () => {} };
          }
        }
        if (rule.oneOf) {
          silenceSassWarnings(rule.oneOf);
        }
        if (rule.rules) {
          silenceSassWarnings(rule.rules);
        }
      }
    };
    silenceSassWarnings(result.module.rules);
  }

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
