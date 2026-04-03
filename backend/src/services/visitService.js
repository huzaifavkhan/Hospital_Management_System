const prisma = require('../db/prisma');
const { parseId } = require('../utils/ids');

const getVisitsByPatient = async (patientId) => {
  const numericId = parseId(patientId);
  const patient = await prisma.patient.findUnique({ where: { id: numericId } });
  if (!patient) {
    const err = new Error('Patient not found');
    err.status = 404;
    throw err;
  }

  return prisma.visit.findMany({
    where: { patientId: numericId },
    orderBy: { visitDate: 'desc' },
    include: {
      doctor: { select: { id: true, doctorId: true, name: true, specialization: true } },
    },
  });
};

const createVisit = async (patientId, { doctorId, visitDate, diagnosis, summary }) => {
  const numericPatientId = parseId(patientId);
  if (!doctorId || !visitDate) {
    const err = new Error('doctorId and visitDate are required');
    err.status = 400;
    throw err;
  }
  const numericDoctorId = parseId(doctorId);

  const [patient, doctor] = await Promise.all([
    prisma.patient.findUnique({ where: { id: numericPatientId } }),
    prisma.doctor.findUnique({ where: { id: numericDoctorId } }),
  ]);
  if (!patient) {
    const err = new Error('Patient not found');
    err.status = 404;
    throw err;
  }
  if (!doctor) {
    const err = new Error('Doctor not found');
    err.status = 404;
    throw err;
  }

  const parsedDate = new Date(visitDate);
  if (isNaN(parsedDate.getTime())) {
    const err = new Error('visitDate must be a valid ISO date string');
    err.status = 400;
    throw err;
  }

  return prisma.visit.create({
    data: {
      patientId: numericPatientId,
      doctorId: numericDoctorId,
      visitDate: parsedDate,
      diagnosis,
      summary,
    },
    include: {
      doctor: { select: { id: true, doctorId: true, name: true, specialization: true } },
      patient: { select: { id: true, patientId: true, name: true } },
    },
  });
};

const updateVisit = async (patientId, visitId, { diagnosis, summary, visitDate }) => {
  const numericPatientId = parseId(patientId);
  const numericId = parseId(visitId);
  const visit = await prisma.visit.findFirst({ where: { id: numericId, patientId: numericPatientId } });
  if (!visit) {
    const err = new Error('Visit not found');
    err.status = 404;
    throw err;
  }
  if (visit.patientId !== numericPatientId) {
    const err = new Error('Visit not found');
    err.status = 404;
    throw err;
  }

  const updateData = {};
  if (diagnosis !== undefined) updateData.diagnosis = diagnosis;
  if (summary !== undefined) updateData.summary = summary;
  if (visitDate !== undefined) {
    const parsed = new Date(visitDate);
    if (isNaN(parsed.getTime())) {
      const err = new Error('visitDate must be a valid ISO date string');
      err.status = 400;
      throw err;
    }
    updateData.visitDate = parsed;
  }

  return prisma.visit.update({
    where: { id: numericId },
    data: updateData,
    include: {
      doctor: { select: { id: true, doctorId: true, name: true, specialization: true } },
    },
  });
};

const deleteVisit = async (patientId, visitId) => {
  const numericPatientId = parseId(patientId);
  const numericVisitId = parseId(visitId);

  await prisma.$transaction(async (tx) => {
    const visit = await tx.visit.findFirst({
      where: { id: numericVisitId, patientId: numericPatientId },
    });

    if (!visit) {
      const err = new Error('Visit not found');
      err.status = 404;
      throw err;
    }

    await tx.visit.delete({ where: { id: numericVisitId } });
  });

  return { message: 'Visit deleted successfully' };
};

module.exports = { getVisitsByPatient, createVisit, updateVisit, deleteVisit };
