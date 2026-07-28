import { withModuleFederation } from '@nx/module-federation/angular';
import config from './module-federation.config';

/**
 * Configuración de build "standalone" (sin micro-frontend de camarón).
 *
 * Usada por empresas exclusivamente de cacao —hoy UNOCACE— donde el módulo
 * shrimpMfe está deshabilitado (`enableShrimpModule = 'false'` en env.js).
 * Produce un `mf-manifest.json` con `remotes: []`, que es exactamente lo que
 * corre hoy en https://inatrace.test.unocace.com (verificado 2026-07-28).
 *
 * Diferencia única vs. webpack.prod.config.ts: ahí se inyecta
 * `remotes: [['shrimpMfe', '/shrimpMfe/remoteEntry.mjs']]`; aquí se fuerza
 * la lista vacía para no arrastrar el remote de camarón al bundle del host.
 *
 * El resto (silenciado de warnings de Sass, fix de `import.meta`) se mantiene
 * idéntico a webpack.prod.config.ts para no divergir en comportamiento.
 */
export default async function (webpackConfig: any, options: any, target: any) {
  const mfFn = await withModuleFederation(
    {
      ...config,
      remotes: [],
    },
    { dts: false },
  );
  const result = await mfFn(webpackConfig);

  // Silence Sass deprecation warnings from dependencies and local files
  if (result.module && result.module.rules) {
    const silenceSassWarnings = (rules: any[]) => {
      if (!rules) return;
      for (const rule of rules) {
        if (rule.loader && rule.loader.includes('sass-loader')) {
          rule.options = rule.options || {};
          rule.options.sassOptions = rule.options.sassOptions || {};
          rule.options.sassOptions.quietDeps = true;
          rule.options.sassOptions.logger = { warn: () => {}, debug: () => {} };
        }
        if (rule.use) {
          if (Array.isArray(rule.use)) {
            for (let i = 0; i < rule.use.length; i++) {
              const useEntry = rule.use[i];
              if (typeof useEntry === 'string' && useEntry.includes('sass-loader')) {
                rule.use[i] = {
                  loader: useEntry,
                  options: {
                    sassOptions: {
                      quietDeps: true,
                      logger: { warn: () => {}, debug: () => {} },
                    },
                  },
                };
              } else if (
                useEntry &&
                typeof useEntry === 'object' &&
                useEntry.loader &&
                useEntry.loader.includes('sass-loader')
              ) {
                useEntry.options = useEntry.options || {};
                useEntry.options.sassOptions = useEntry.options.sassOptions || {};
                useEntry.options.sassOptions.quietDeps = true;
                useEntry.options.sassOptions.logger = { warn: () => {}, debug: () => {} };
              }
            }
          } else if (typeof rule.use === 'string' && rule.use.includes('sass-loader')) {
            rule.use = {
              loader: rule.use,
              options: {
                sassOptions: {
                  quietDeps: true,
                  logger: { warn: () => {}, debug: () => {} },
                },
              },
            };
          } else if (
            typeof rule.use === 'object' &&
            rule.use.loader &&
            rule.use.loader.includes('sass-loader')
          ) {
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
  if (result.output) {
    result.output.scriptType = 'text/javascript' as const;
  }

  return result;
}
