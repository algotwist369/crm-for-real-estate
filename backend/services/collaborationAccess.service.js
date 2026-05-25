const mongoose = require('mongoose');
const User = require('../model/user.model');
const { httpError } = require('../utils/common');

function getTenantId(auth) {
    return auth.tenant_id || auth.user?.tenant_id || auth.user?._id;
}

function asObjectId(id, field = 'id') {
    if (!mongoose.Types.ObjectId.isValid(id)) throw httpError(400, `Invalid ${field}`);
    return new mongoose.Types.ObjectId(id);
}

async function getTenantUsers(auth, extraMatch = {}) {
    const tenantId = getTenantId(auth);
    const match = {
        is_active: true,
        is_deleted: false,
        ...extraMatch,
        $or: [
            { _id: tenantId },
            { tenant_id: tenantId }
        ]
    };

    return User.find(match)
        .select('user_name email phone_number profile_pic role tenant_id last_login_at')
        .sort({ role: 1, user_name: 1 })
        .lean();
}

async function assertUsersInTenant(auth, userIds = []) {
    const ids = [...new Set(userIds.filter(Boolean).map(String))];
    if (!ids.length) return [];

    ids.forEach(id => asObjectId(id, 'userId'));
    const tenantUsers = await getTenantUsers(auth, { _id: { $in: ids } });
    const found = new Set(tenantUsers.map(u => String(u._id)));
    const missing = ids.filter(id => !found.has(id));
    if (missing.length) throw httpError(403, 'One or more users are outside your organization');

    return tenantUsers;
}

function canManageTenant(auth) {
    return ['admin', 'super_admin'].includes(auth.payload?.role);
}

module.exports = {
    getTenantId,
    asObjectId,
    getTenantUsers,
    assertUsersInTenant,
    canManageTenant
};
