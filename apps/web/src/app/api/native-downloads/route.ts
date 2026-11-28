import { NextResponse } from 'next/server';

export const revalidate = 300;

const repository = process.env.GITHUB_REPOSITORY ?? 'kavinmm-23EIR047/OllaiBooks';

export async function GET() {
  try {
    const response = await fetch(`https://api.github.com/repos/${repository}/releases/latest`, {
      headers: { Accept: 'application/vnd.github+json' },
      next: { revalidate: 300 },
    });

    if (response.status === 404) {
      return NextResponse.json({ release: null, downloads: {} }, { headers: { 'Cache-Control': 'public, s-maxage=300' } });
    }
    if (!response.ok) throw new Error(`GitHub Releases returned ${response.status}`);

    const release = await response.json();
    const assets: Array<{ name: string; browser_download_url: string }> = release.assets ?? [];
    const pick = (matches: (name: string) => boolean) => assets.find(asset => matches(asset.name));
    const windows = pick(name => /\.exe$/i.test(name) && /setup|installer/i.test(name))
      ?? pick(name => /\.exe$/i.test(name));
    const mac = pick(name => /\.dmg$/i.test(name));
    const android = pick(name => /\.apk$/i.test(name));
    const ios = pick(name => /\.ipa$/i.test(name));

    return NextResponse.json({
      release: { name: release.name || release.tag_name, url: release.html_url },
      downloads: {
        windows: windows && { name: windows.name, url: windows.browser_download_url },
        mac: mac && { name: mac.name, url: mac.browser_download_url },
        android: android && { name: android.name, url: android.browser_download_url },
        ios: ios && { name: ios.name, url: ios.browser_download_url },
      },
    }, { headers: { 'Cache-Control': 'public, s-maxage=300' } });
  } catch {
    return NextResponse.json({ release: null, downloads: {}, unavailable: true }, { status: 503 });
  }
}
