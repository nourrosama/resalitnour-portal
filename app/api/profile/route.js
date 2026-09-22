import { getServerSession } from 'next-auth';
import { authOptions } from '../../../lib/auth';
import connectDB from '../../../lib/mongodb';
import Profile from '../../../models/Profile';

// GET /api/profile — current user's profile
export async function GET(req) {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  await connectDB();
  const profile = await Profile.findOne({ userId: session.user.id });
  return Response.json({ profile: profile || null });
}

// PATCH /api/profile — current user updates their own profile
export async function PATCH(req) {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  await connectDB();
  const body = await req.json();

  const profile = await Profile.findOneAndUpdate(
    { userId: session.user.id },
    { ...body, lastUpdatedBy: 'user' },
    { new: true, upsert: true, runValidators: true }
  );

  return Response.json({ profile });
}
