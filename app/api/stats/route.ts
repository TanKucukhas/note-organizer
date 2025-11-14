import { NextResponse } from 'next/server';
import { getDatabaseStats, getAccounts, getFolders, getTimelineData } from '@/lib/db';

export async function GET() {
  try {
    const stats = getDatabaseStats();
    const accounts = getAccounts();
    const folders = getFolders();
    const timeline = getTimelineData('month');

    return NextResponse.json({
      ...stats,
      accountsList: accounts,
      foldersList: folders,
      timeline,
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    );
  }
}
