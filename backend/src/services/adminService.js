const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// ── Statistics ──────────────────────────────────────────────────────────────

const getStats = async () => {
  const [totalPatients, totalDoctors, totalDepartments, totalUsers, departmentBreakdown] =
    await Promise.all([
      prisma.patient.count(),
      prisma.doctor.count(),
      prisma.department.count(),
      prisma.user.count(),
      prisma.department.findMany({
        include: { _count: { select: { doctors: true } } },
        orderBy: { name: 'asc' },
      }),
    ]);

  return {
    totalPatients,
    totalDoctors,
    totalDepartments,
    totalUsers,
    departmentBreakdown: departmentBreakdown.map((d) => ({
      id: d.id,
      name: d.name,
      doctorCount: d._count.doctors,
    })),
  };
};

// ── Departments ─────────────────────────────────────────────────────────────

const getAllDepartments = async () => {
  return prisma.department.findMany({
    orderBy: { name: 'asc' },
    include: { _count: { select: { doctors: true } } },
  });
};

const getDepartmentById = async (id) => {
  const dept = await prisma.department.findUnique({
    where: { id: Number(id) },
    include: {
      doctors: { select: { id: true, doctorId: true, name: true, specialization: true } },
    },
  });
  if (!dept) {
    const err = new Error('Department not found');
    err.status = 404;
    throw err;
  }
  return dept;
};

const createDepartment = async ({ name, description }) => {
  if (!name) {
    const err = new Error('name is required');
    err.status = 400;
    throw err;
  }
  try {
    return await prisma.department.create({ data: { name, description } });
  } catch (e) {
    if (e.code === 'P2002') {
      const err = new Error('Department name already exists');
      err.status = 409;
      throw err;
    }
    throw e;
  }
};

const updateDepartment = async (id, { name, description }) => {
  await getDepartmentById(id);
  try {
    return await prisma.department.update({
      where: { id: Number(id) },
      data: { ...(name && { name }), ...(description !== undefined && { description }) },
    });
  } catch (e) {
    if (e.code === 'P2002') {
      const err = new Error('Department name already exists');
      err.status = 409;
      throw err;
    }
    throw e;
  }
};

const deleteDepartment = async (id) => {
  await getDepartmentById(id);
  await prisma.department.delete({ where: { id: Number(id) } });
  return { message: 'Department deleted successfully' };
};

// ── Users ────────────────────────────────────────────────────────────────────

const getAllUsers = async ({ page = 1, limit = 10, search, role } = {}) => {
  const skip = (page - 1) * limit;

  const where = {};
  if (search) {
    where.OR = [
      { username: { contains: search, mode: 'insensitive' } },
      { fullName: { contains: search, mode: 'insensitive' } },
    ];
  }
  if (role) where.role = role;

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: Number(limit),
      orderBy: { createdAt: 'desc' },
      select: { id: true, username: true, fullName: true, role: true, isActive: true, createdAt: true, updatedAt: true },
    }),
    prisma.user.count({ where }),
  ]);

  return { users, pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / limit) } };
};

const getUserById = async (id) => {
  const user = await prisma.user.findUnique({
    where: { id: Number(id) },
    select: { id: true, username: true, fullName: true, role: true, isActive: true, createdAt: true, updatedAt: true },
  });
  if (!user) {
    const err = new Error('User not found');
    err.status = 404;
    throw err;
  }
  return user;
};

const createUser = async ({ username, password, fullName, role }) => {
  if (!username || !password || !fullName) {
    const err = new Error('username, password, and fullName are required');
    err.status = 400;
    throw err;
  }
  const existing = await prisma.user.findUnique({ where: { username } });
  if (existing) {
    const err = new Error('Username already exists');
    err.status = 409;
    throw err;
  }
  const hashed = await bcrypt.hash(password, 10);
  return prisma.user.create({
    data: { username, password: hashed, fullName, role: role || 'RECEPTIONIST' },
    select: { id: true, username: true, fullName: true, role: true, isActive: true, createdAt: true },
  });
};

const updateUser = async (id, data) => {
  await getUserById(id);
  const updateData = {};
  if (data.fullName) updateData.fullName = data.fullName;
  if (data.role) updateData.role = data.role;
  if (data.isActive !== undefined) updateData.isActive = Boolean(data.isActive);
  if (data.password) updateData.password = await bcrypt.hash(data.password, 10);

  return prisma.user.update({
    where: { id: Number(id) },
    data: updateData,
    select: { id: true, username: true, fullName: true, role: true, isActive: true, updatedAt: true },
  });
};

const deactivateUser = async (id) => {
  await getUserById(id);
  await prisma.user.update({ where: { id: Number(id) }, data: { isActive: false } });
  return { message: 'User deactivated successfully' };
};

// ── Audit Logs ───────────────────────────────────────────────────────────────

const getAuditLogs = async ({ page = 1, limit = 20, entity, action } = {}) => {
  const skip = (page - 1) * limit;
  const where = {};
  if (entity) where.entity = entity;
  if (action) where.action = action;

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      skip,
      take: Number(limit),
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { id: true, username: true, fullName: true } } },
    }),
    prisma.auditLog.count({ where }),
  ]);

  return { logs, pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / limit) } };
};

// ── Hospital Settings ────────────────────────────────────────────────────────

const getSettings = async () => {
  const settings = await prisma.hospitalSettings.findMany();
  return settings.reduce((acc, s) => ({ ...acc, [s.key]: s.value }), {});
};

const updateSettings = async (settingsMap) => {
  const updates = await Promise.all(
    Object.entries(settingsMap).map(([key, value]) =>
      prisma.hospitalSettings.upsert({
        where: { key },
        update: { value: String(value) },
        create: { key, value: String(value) },
      })
    )
  );
  return updates.reduce((acc, s) => ({ ...acc, [s.key]: s.value }), {});
};

// ── Reports ──────────────────────────────────────────────────────────────────

const generateReport = async ({ type, from, to } = {}) => {
  const dateFilter = {};
  if (from) dateFilter.gte = new Date(from);
  if (to) dateFilter.lte = new Date(to);
  const createdAt = Object.keys(dateFilter).length ? dateFilter : undefined;

  if (type === 'patients') {
    const patients = await prisma.patient.findMany({
      where: createdAt ? { createdAt } : {},
      orderBy: { createdAt: 'desc' },
      include: { doctors: { include: { doctor: { select: { name: true, specialization: true } } } } },
    });
    return { type: 'patients', count: patients.length, data: patients };
  }

  if (type === 'doctors') {
    const doctors = await prisma.doctor.findMany({
      where: createdAt ? { createdAt } : {},
      orderBy: { createdAt: 'desc' },
      include: {
        department: { select: { name: true } },
        _count: { select: { patients: true } },
      },
    });
    return { type: 'doctors', count: doctors.length, data: doctors };
  }

  // Default: combined summary
  const [patients, doctors] = await Promise.all([
    prisma.patient.count({ where: createdAt ? { createdAt } : {} }),
    prisma.doctor.count({ where: createdAt ? { createdAt } : {} }),
  ]);
  return { type: 'summary', data: { patients, doctors } };
};

module.exports = {
  getStats,
  getAllDepartments,
  getDepartmentById,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deactivateUser,
  getAuditLogs,
  getSettings,
  updateSettings,
  generateReport,
};
