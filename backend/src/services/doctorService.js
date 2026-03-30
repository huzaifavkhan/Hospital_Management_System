const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const generateDoctorId = async () => {
  const count = await prisma.doctor.count();
  return `DOC-${String(count + 1).padStart(5, '0')}`;
};

const getAllDoctors = async ({ page = 1, limit = 10, search, departmentId, specialization } = {}) => {
  const skip = (page - 1) * limit;

  const where = {};
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { specialization: { contains: search, mode: 'insensitive' } },
      { doctorId: { contains: search, mode: 'insensitive' } },
    ];
  }
  if (departmentId) where.departmentId = Number(departmentId);
  if (specialization) where.specialization = { contains: specialization, mode: 'insensitive' };

  const [doctors, total] = await Promise.all([
    prisma.doctor.findMany({
      where,
      skip,
      take: Number(limit),
      orderBy: { createdAt: 'desc' },
      include: {
        department: { select: { id: true, name: true } },
        patients: {
          include: {
            patient: { select: { id: true, patientId: true, name: true } },
          },
        },
      },
    }),
    prisma.doctor.count({ where }),
  ]);

  return {
    doctors,
    pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / limit) },
  };
};

const getDoctorById = async (id) => {
  const doctor = await prisma.doctor.findUnique({
    where: { id: Number(id) },
    include: {
      department: { select: { id: true, name: true } },
      patients: {
        include: {
          patient: { select: { id: true, patientId: true, name: true, age: true, gender: true } },
        },
      },
    },
  });
  if (!doctor) {
    const err = new Error('Doctor not found');
    err.status = 404;
    throw err;
  }
  return doctor;
};

const createDoctor = async ({ name, specialization, contactNumber, availabilitySchedule, departmentId }) => {
  if (!name || !specialization || !contactNumber) {
    const err = new Error('name, specialization, and contactNumber are required');
    err.status = 400;
    throw err;
  }

  if (departmentId) {
    const dept = await prisma.department.findUnique({ where: { id: Number(departmentId) } });
    if (!dept) {
      const err = new Error('Department not found');
      err.status = 404;
      throw err;
    }
  }

  const doctorId = await generateDoctorId();
  const doctor = await prisma.doctor.create({
    data: {
      doctorId,
      name,
      specialization,
      contactNumber,
      availabilitySchedule: availabilitySchedule || null,
      departmentId: departmentId ? Number(departmentId) : null,
    },
    include: { department: { select: { id: true, name: true } } },
  });
  return doctor;
};

const updateDoctor = async (id, data) => {
  await getDoctorById(id);

  if (data.departmentId) {
    const dept = await prisma.department.findUnique({ where: { id: Number(data.departmentId) } });
    if (!dept) {
      const err = new Error('Department not found');
      err.status = 404;
      throw err;
    }
  }

  const allowed = ['name', 'specialization', 'contactNumber', 'availabilitySchedule', 'departmentId'];
  const updateData = {};
  for (const key of allowed) {
    if (data[key] !== undefined) {
      updateData[key] = key === 'departmentId' ? Number(data[key]) : data[key];
    }
  }

  const doctor = await prisma.doctor.update({
    where: { id: Number(id) },
    data: updateData,
    include: { department: { select: { id: true, name: true } } },
  });
  return doctor;
};

const deleteDoctor = async (id) => {
  await getDoctorById(id);
  await prisma.doctor.delete({ where: { id: Number(id) } });
  return { message: 'Doctor removed successfully' };
};

const assignPatient = async (doctorId, patientId) => {
  const doctor = await prisma.doctor.findUnique({ where: { id: Number(doctorId) } });
  if (!doctor) {
    const err = new Error('Doctor not found');
    err.status = 404;
    throw err;
  }

  const patient = await prisma.patient.findUnique({ where: { id: Number(patientId) } });
  if (!patient) {
    const err = new Error('Patient not found');
    err.status = 404;
    throw err;
  }

  const existing = await prisma.patientDoctor.findUnique({
    where: { patientId_doctorId: { patientId: Number(patientId), doctorId: Number(doctorId) } },
  });
  if (existing) {
    const err = new Error('Patient is already assigned to this doctor');
    err.status = 409;
    throw err;
  }

  const assignment = await prisma.patientDoctor.create({
    data: { doctorId: Number(doctorId), patientId: Number(patientId) },
    include: {
      patient: { select: { id: true, patientId: true, name: true } },
      doctor: { select: { id: true, doctorId: true, name: true } },
    },
  });
  return assignment;
};

const unassignPatient = async (doctorId, patientId) => {
  const assignment = await prisma.patientDoctor.findUnique({
    where: { patientId_doctorId: { patientId: Number(patientId), doctorId: Number(doctorId) } },
  });
  if (!assignment) {
    const err = new Error('Assignment not found');
    err.status = 404;
    throw err;
  }

  await prisma.patientDoctor.delete({
    where: { patientId_doctorId: { patientId: Number(patientId), doctorId: Number(doctorId) } },
  });
  return { message: 'Patient unassigned successfully' };
};

const getDoctorPatients = async (doctorId) => {
  const doctor = await prisma.doctor.findUnique({ where: { id: Number(doctorId) } });
  if (!doctor) {
    const err = new Error('Doctor not found');
    err.status = 404;
    throw err;
  }

  const assignments = await prisma.patientDoctor.findMany({
    where: { doctorId: Number(doctorId) },
    include: { patient: true },
    orderBy: { assignedAt: 'desc' },
  });
  return assignments.map((a) => ({ ...a.patient, assignedAt: a.assignedAt }));
};

module.exports = {
  getAllDoctors,
  getDoctorById,
  createDoctor,
  updateDoctor,
  deleteDoctor,
  assignPatient,
  unassignPatient,
  getDoctorPatients,
};
