import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../../../lib/auth';
import connectDB from '../../../../../../lib/mongodb';
import Profile from '../../../../../../models/Profile';

// GET /api/admin/users/[id]/profile
export async function GET(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'admin') {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  await connectDB();
  const profile = await Profile.findOne({ userId: params.id });
  return Response.json({ profile: profile || null });
}

// PATCH /api/admin/users/[id]/profile
export async function PATCH(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'admin') {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  await connectDB();
  const body = await req.json();

  const profile = await Profile.findOneAndUpdate(
    { userId: params.id },
    { ...body, userId: params.id, lastUpdatedBy: 'admin' },
    { new: true, upsert: true, runValidators: true }
  );

  return Response.json({ profile });
}
