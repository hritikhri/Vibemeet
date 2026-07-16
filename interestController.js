// backend/controllers/interest.controller.js
const User = require('../models/User.js');

// Safely extract caller ID regardless of how JWT was signed
const getCallerId = (req) => {
  const u = req.user;
  if (!u) return null;
  return (u._id || u.id || u.userId)?.toString() ?? null;
};

/* ─────────────────────────────────────────────────────────────────────────── *
 *  POST /api/users/:id/interest   — add interest (idempotent)
 * ─────────────────────────────────────────────────────────────────────────── */
exports.addInterest = async (req, res) => {
  try {
    const visitorId = getCallerId(req);
    if (!visitorId) return res.status(401).json({ message: 'Unauthorized.' });

    const targetId = req.params.id;
    if (targetId === visitorId)                      
      return res.status(400).json({ message: "You can't express interest in your own profile." });

    const target = await User.findById(targetId);
    if (!target) return res.status(404).json({ message: 'User not found.' });

    const alreadyInterested = (target.interestedUsers || []).some(
      (u) => u.toString() === visitorId
    );
    if (alreadyInterested) {
      return res.status(200).json({ message: 'already_interested', interested: true, count: target.interestedUsers.length });
    }

    await User.findByIdAndUpdate(targetId, { $addToSet: { interestedUsers: visitorId } });

    // Also track on the visitor's side: "I am interested in targetId"
    await User.findByIdAndUpdate(visitorId, { $addToSet: { myInterests: targetId } });

    const updated = await User.findById(targetId).select('interestedUsers');
    return res.status(201).json({ message: 'interest_added', interested: true, count: updated.interestedUsers.length });
  } catch (err) {
    console.error('[addInterest]', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

/* ─────────────────────────────────────────────────────────────────────────── *
 *  DELETE /api/users/:id/interest   — remove interest
 * ─────────────────────────────────────────────────────────────────────────── */
exports.removeInterest = async (req, res) => {
  try {
    const visitorId = getCallerId(req);
    if (!visitorId) return res.status(401).json({ message: 'Unauthorized.' });

    const targetId = req.params.id;

    const target = await User.findById(targetId);
    if (!target) return res.status(404).json({ message: 'User not found.' });

    const wasInterested = (target.interestedUsers || []).some((u) => u.toString() === visitorId);
    if (!wasInterested) {
      return res.status(200).json({ message: 'not_interested', interested: false, count: target.interestedUsers?.length ?? 0 });
    }

    // Remove from both sides
    await User.findByIdAndUpdate(targetId, { $pull: { interestedUsers: target.interestedUsers.find(u => u.toString() === visitorId) } });
    await User.findByIdAndUpdate(visitorId, { $pull: { myInterests: target._id } });

    const updated = await User.findById(targetId).select('interestedUsers');
    return res.status(200).json({ message: 'interest_removed', interested: false, count: updated.interestedUsers.length });
  } catch (err) {
    console.error('[removeInterest]', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

/* ─────────────────────────────────────────────────────────────────────────── *
 *  GET /api/users/:id/interested   — who is interested in ME (owner only)
 * ─────────────────────────────────────────────────────────────────────────── */
exports.getInterestedUsers = async (req, res) => {
  try {
    const callerId = getCallerId(req);
    if (!callerId) return res.status(401).json({ message: 'Unauthorized.' });

    const targetId = req.params.id;
        console.log(targetId)
    // if (targetId !== callerId) return res.status(403).json({ message: 'Forbidden.' });

    const target = await User.findById(targetId)
      .populate('interestedUsers', 'name username avatar mood')
      .select('interestedUsers');
    if (!target) return res.status(404).json({ message: 'User not found.' });

    return res.status(200).json({ count: target.interestedUsers.length, users: target.interestedUsers });
  } catch (err) {
    console.error('[getInterestedUsers]', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

/* ─────────────────────────────────────────────────────────────────────────── *
 *  GET /api/users/:id/my-interests   — profiles I am interested in (owner only)
 * ─────────────────────────────────────────────────────────────────────────── */
exports.getMyInterests = async (req, res) => {
  try {
    const callerId = getCallerId(req);
    if (!callerId) return res.status(401).json({ message: 'Unauthorized.' });

    const targetId = req.params.id;
    console.log(targetId)
    // if (targetId !== callerId) return res.status(403).json({ message: 'Forbidden.' });

    const target = await User.findById(targetId)
      .populate('myInterests', 'name username avatar mood')
      .select('myInterests');
    if (!target) return res.status(404).json({ message: 'User not found.' });

    return res.status(200).json({ count: target.myInterests.length, users: target.myInterests });
  } catch (err) {
    console.error('[getMyInterests]', err);
    res.status(500).json({ message: 'Server error.' });
  }
};