// Hard deletes used by the admin. Each one also cleans up the records that point to what is deleted,
// so nothing is left referencing a missing case/user.
import mongoose from 'mongoose'
import Case from '../models/Case'
import Delivery from '../models/Delivery'
import Request from '../models/Request'
import Message from '../models/Message'
import User from '../models/User'
import Profile from '../models/Profile'
import { closeIfComplete } from './deliveryCode'

// Delete cases + their requests; remove them from deliveries (a delivery left with no cases is deleted)
export async function deleteCases(caseIds) {
  const ids = caseIds.map(id => new mongoose.Types.ObjectId(String(id)))
  if (!ids.length) return { cases: 0 }
  const cases = await Case.find({ _id: { $in: ids } }).select('points').lean()
  const pointsById = Object.fromEntries(cases.map(c => [String(c._id), Number(c.points) || 0]))

  const deliveries = await Delivery.find({ 'beneficiaries.caseId': { $in: ids } })
  let deliveriesRemoved = 0
  for (const d of deliveries) {
    const removed = d.beneficiaries.filter(b => pointsById[String(b.caseId)] !== undefined)
    d.beneficiaries = d.beneficiaries.filter(b => pointsById[String(b.caseId)] === undefined)
    if (!d.beneficiaries.length) {
      await Delivery.deleteOne({ _id: d._id })
      deliveriesRemoved++
      continue
    }
    const minus = removed.reduce((s, b) => s + pointsById[String(b.caseId)], 0)
    d.deliveryPoints = Math.max(0, (d.deliveryPoints || 0) - minus)
    closeIfComplete(d)
    await d.save()
  }

  await Request.deleteMany({ caseId: { $in: ids } })
  await Message.updateMany({ caseId: { $in: ids } }, { $unset: { caseId: 1 } })
  const res = await Case.deleteMany({ _id: { $in: ids } })
  return { cases: res.deletedCount, deliveriesRemoved }
}

// Delete a user and everything that belongs to them
export async function deleteUser(userId) {
  const uid = new mongoose.Types.ObjectId(String(userId))
  const caseIds = (await Case.find({ submittedBy: uid }).select('_id').lean()).map(c => c._id)
  await deleteCases(caseIds)
  await Delivery.deleteMany({ userId: uid })
  await Request.deleteMany({ submittedBy: uid })
  await Message.deleteMany({ $or: [{ from: uid }, { to: uid }] })
  await Profile.deleteMany({ userId: uid })
  const res = await User.deleteOne({ _id: uid })
  return { users: res.deletedCount, cases: caseIds.length }
}
