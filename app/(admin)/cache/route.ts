import { NextResponse } from 'next/server';
import { initializeCache, isCacheInitialized, getModelsCacheLastRefreshed, getMetaCacheLastRefreshed } from '@/lib/cache/initialize';
import { getAllAIModels, getAllMetaDocuments } from '@/lib/cache';
import { auth } from '@/app/(auth)/auth';

/**
 * GET handler to check cache status
 */
export async function GET() {
  try {
    const isInitialized = isCacheInitialized();
    const modelsLastRefreshed = getModelsCacheLastRefreshed();
    const metaLastRefreshed = getMetaCacheLastRefreshed();

    return NextResponse.json({
      status: 'success',
      data: {
        initialized: isInitialized,
        modelsLastRefreshed,
        modelsLastRefreshedFormatted: modelsLastRefreshed ? new Date(modelsLastRefreshed).toLocaleString() : null,
        metaLastRefreshed,
        metaLastRefreshedFormatted: metaLastRefreshed ? new Date(metaLastRefreshed).toLocaleString() : null,
        modelsCount: isInitialized ? getAllAIModels().length : 0,
        metaCount: isInitialized ? getAllMetaDocuments().length : 0,
      }
    });
  } catch (error) {
    console.error('Error checking cache status:', error);
    return NextResponse.json(
      { status: 'error', message: 'Failed to check cache status' },
      { status: 500 }
    );
  }
}

/**
 * POST handler to refresh the cache
 */
export async function POST() {
  try {
    // Check authentication - only allow admin users
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json(
        { status: 'error', message: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (session.user.isAdmin !== true) {
      return NextResponse.json(
        { status: 'error', message: 'Forbidden' },
        { status: 403 }
      );
    }

    // Refresh the cache
    // TODO accept optional parameter to choose which cache to refresh
    await initializeCache();

    // Get the new timestamps after refresh
    const modelsLastRefreshed = getModelsCacheLastRefreshed();
    const metaLastRefreshed = getMetaCacheLastRefreshed();

    return NextResponse.json({
      status: 'success',
      message: 'Cache refreshed successfully',
      data: {
        modelsLastRefreshed,
        modelsLastRefreshedFormatted: modelsLastRefreshed ? new Date(modelsLastRefreshed).toLocaleString() : null,
        metaLastRefreshed,
        metaLastRefreshedFormatted: metaLastRefreshed? new Date(metaLastRefreshed).toLocaleString() : null,
      }
    });
  } catch (error) {
    console.error('Error refreshing cache:', error);
    return NextResponse.json(
      { status: 'error', message: 'Failed to refresh cache' },
      { status: 500 }
    );
  }
}
