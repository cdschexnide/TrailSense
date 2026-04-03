import fs from 'fs';
import path from 'path';

const repoRoot = path.resolve(__dirname, '..', '..');

function readSource(relativePath: string): string {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

describe('startup import graph', () => {
  it.each([
    {
      file: 'src/components/templates/ScreenLayout/ScreenLayout.tsx',
      requiredImports: ['@components/organisms/Header'],
    },
    {
      file: 'src/screens/home/PropertyCommandCenter.tsx',
      requiredImports: [
        '@components/organisms/AlertCard',
        '@components/organisms/MiniPropertyMap',
      ],
    },
    {
      file: 'src/screens/alerts/AlertListScreen.tsx',
      requiredImports: [
        '@components/organisms/AlertCard',
        '@components/organisms/HeaderHero',
      ],
    },
    {
      file: 'src/screens/devices/DeviceListScreen.tsx',
      requiredImports: [
        '@components/organisms/DeviceCard',
        '@components/organisms/HeaderHero',
      ],
    },
  ])(
    '$file avoids the organisms barrel on the boot path',
    ({ file, requiredImports }) => {
      const source = readSource(file);

      expect(source).not.toMatch(/from ['"]@components\/organisms['"]/);
      requiredImports.forEach(importPath => {
        expect(source).toContain(importPath);
      });
    }
  );
});
