import type { App } from './types';
import { PlaceHolderImages, addPlaceholderImage, initializePlaceholderImages } from './placeholder-images';

// Initialize with default data
initializePlaceholderImages();

// The catalog is now empty by default.
const APPS: App[] = [];

export function getApps(): App[] {
  return APPS;
}

export function getAppBySlug(slug: string): App | undefined {
  return APPS.find((app) => app.slug === slug);
}

export function findImage(id: string) {
    return PlaceHolderImages.find(img => img.id === id);
}

export function addApp(appData: { title: string; version: string; description: string }): App {
    const slug = appData.title.toLowerCase().replace(/\s+/g, '-');
    const newId = (APPS.length + 1).toString();

    const newIconId = `icon-new-app-${newId}`;
    addPlaceholderImage({
        id: newIconId,
        description: `Icon for ${appData.title}`,
        imageUrl: `https://picsum.photos/seed/${newId}/128/128`,
        imageHint: "logo abstract"
    });

    const newScreenshotId = `ss-new-app-${newId}`;
    addPlaceholderImage({
        id: newScreenshotId,
        description: `Screenshot for ${appData.title}`,
        imageUrl: `https://picsum.photos/seed/ss${newId}/1080/1920`,
        imageHint: "app interface"
    });


    const newApp: App = {
        id: newId,
        slug,
        title: appData.title,
        version: appData.version,
        description: appData.description,
        iconUrl: newIconId,
        screenshots: [newScreenshotId],
        downloadCount: 0,
    };

    APPS.unshift(newApp); // Add to the beginning of the list
    return newApp;
}
