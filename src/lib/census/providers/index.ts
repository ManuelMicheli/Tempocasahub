import type { ICadastralProvider } from '../cadastral-provider';
import { MockCadastralProvider } from './mock-provider';

export function getCadastralProvider(): ICadastralProvider {
  const provider = process.env.CADASTRAL_PROVIDER || 'mock';

  switch (provider) {
    case 'openapi':
      // Lazy import to avoid loading API client when using mock
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { OpenAPICatastoProvider } = require('./openapi-catasto');
      return new OpenAPICatastoProvider();
    case 'mock':
    default:
      return new MockCadastralProvider();
  }
}
