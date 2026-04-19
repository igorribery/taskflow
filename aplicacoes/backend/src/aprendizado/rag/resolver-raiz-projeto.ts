import * as fs from 'node:fs';
import * as path from 'node:path';

/**
 * Localiza a raiz do monorepo TaskFlow (README + aplicacoes/backend).
 */
export function resolverRaizProjeto(cwd: string, configurado?: string | null): string {
  if (configurado?.trim()) {
    return path.resolve(configurado.trim());
  }
  let dir = path.resolve(cwd);
  for (let i = 0; i < 8; i++) {
    const readme = path.join(dir, 'README.md');
    const backendPkg = path.join(dir, 'aplicacoes', 'backend', 'package.json');
    if (fs.existsSync(readme) && fs.existsSync(backendPkg)) {
      return dir;
    }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return path.resolve(cwd, '..', '..');
}
