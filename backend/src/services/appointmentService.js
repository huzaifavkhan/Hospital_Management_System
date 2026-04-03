const prisma = require('../db/prisma');
const crypto = require('crypto');

const PAGINATION_MAX_LIMIT = 100;
const VALID_STATUSES = ['SCHEDULED', 'CANCELLED', 'COMPLETED', 'RESCHEDULED'];

const parseId = (id) => {
  const num = Number(id);
  if (!Number.isFinite(num) || !Number.isInteger(num) || num < 1) {
    const err = new Error('Invalid ID: must be a positive integer');
    err.status = 400;
    throw err;
  }
  return num;
};

const generateAppointmentId = () => {
  return `APT-${crypto.randomBytes(5).toString('hex').toUpperCase()}`;
};

// Check if a doctor is already booked at the given dateTime (±30 min window)
const checkDoubleBooking = async (doctorId, dateTime, excludeAppointmentId = null) => {
  const windowMs = 30 * 60 * 1000; // 30 minutes
  const start = new Date(dateTime.getTime() - windowMs);
  const end = new Date(dateTime.getTime() + windowMs);

  const where = {
    doctorId,
    status: { in: ['SCHEDULED', 'RESCHEDULED'] },
    dateTime: { gte: start, lte: end },
  };
  if (excludeAppointmentId) {
    where.id = { not: excludeAppointmentId };
  }

  const conflict = await prisma.appointment.findFirst({ where });
  return conflict;
};

const getAllAppointments = async ({ page = 1, limit = 10, patientId, doctorId, status, from, to } = {}) => {
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(Math.max(1, parseInt(limit, 10) || 10), PAGINATION_MAX_LIMIT);
  const skip = (pageNum - 1) * limitNum;

  const where = {};
  if (patientId) where.patientId = parseId(patientId);
  if (doctorId) where.doctorId = parseId(doctorId);
  if (status) {
    if (!VALID_STATUSES.includes(status)) {
      const err = new Error(`status must be one of: ${VALID_STATUSES.join(', ')}`);
      err.status = 400;
      throw err;
    }
    where.status = status;
  }
  if (from || to) {
    where.dateTime = {};
    if (from) where.dateTime.gte = new Date(from);
    if (to) where.dateTime.lte = new Date(to);
  }

  const [appointments, total] = await Promise.all([
    prisma.appointment.findMany({
      where,
      skip,
      take: limitNum,
      orderBy: { dateTime: 'asc' },
      include: {
        patient: { select: { id: true, patientId: true, name: true, contactNumber: true } },
        doctor: { select: { id: true, doctorId: true, name: true, specialization: true } },
      },
    }),
    prisma.appointment.count({ where }),
  ]);

  return { appointments, pagination: { total, page: pageNum, limit: limitNum, pages: Math.ceil(total / limitNum) } };
};

const getAppointmentById = async (id) => {
  const numericId = parseId(id);
  const appointment = await prisma.appointment.findUnique({
    where: { id: numericId },
    include: {
      patient: { select: { id: true, patientId: true, name: true, contactNumber: true } },
      doctor: { select: { id: true, doctorId: true, name: true, specialization: true } },
    },
  });
  if (!appointment) {
    const err = new Error('Appointment not found');
    err.status = 404;
    throw err;
  }
  return appointment;
};

const createAppointment = async ({ patientId, doctorId, dateTime, notes }) => {
  if (!patientId || !doctorId || !dateTime) {
    const err = new Error('patientId, doctorId, and dateTime are required');
    err.status = 400;
    throw err;
  }
  const numericPatientId = parseId(patientId);
  const numericDoctorId = parseId(doctorId);

  const parsedDate = new Date(dateTime);
  if (isNaN(parsedDate.getTime())) {
    const err = new Error('dateTime must be a valid ISO date string');
    err.status = 400;
    throw err;
  }

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

  const conflict = await checkDoubleBooking(numericDoctorId, parsedDate);
  if (conflict) {
    const err = new Error(`Doctor already has an appointment at this time (${conflict.dateTime.toISOString()}). Please choose a different time slot.`);
    err.status = 409;
    throw err;
  }

  const appointmentId = generateAppointmentId();

  return prisma.appointment.create({
    data: {
      appointmentId,
      patientId: numericPatientId,
      doctorId: numericDoctorId,
      dateTime: parsedDate,
      notes,
    },
    include: {
      patient: { select: { id: true, patientId: true, name: true, contactNumber: true } },
      doctor: { select: { id: true, doctorId: true, name: true, specialization: true } },
    },
  });
};

const updateAppointment = async (id, { dateTime, notes, status }) => {
  const numericId = parseId(id);
  const existing = await prisma.appointment.findUnique({ where: { id: numericId } });
  if (!existing) {
    const err = new Error('Appointment not found');
    err.status = 404;
    throw err;
  }

  const updateData = {};

  if (status !== undefined) {
    if (!VALID_STATUSES.includes(status)) {
      const err = new Error(`status must be one of: ${VALID_STATUSES.join(', ')}`);
      err.status = 400;
      throw err;
    }
    updateData.status = status;
  }

  if (dateTime !== undefined) {
    const parsedDate = new Date(dateTime);
    if (isNaN(parsedDate.getTime())) {
      const err = new Error('dateTime must be a valid ISO date string');
      err.status = 400;
      throw err;
    }
    // Check double-booking on reschedule, excluding this appointment
    const conflict = await checkDoubleBooking(existing.doctorId, parsedDate, numericId);
    if (conflict) {
      const err = new Error(`Doctor already has an appointment at this time (${conflict.dateTime.toISOString()}). Please choose a different time slot.`);
      err.status = 409;
      throw err;
    }
    updateData.dateTime = parsedDate;
    // Auto-set status to RESCHEDULED if only changing time
    if (!status) updateData.status = 'RESCHEDULED';
  }

  if (notes !== undefined) updateData.notes = notes;

  return prisma.appointment.update({
    where: { id: numericId },
    data: updateData,
    include: {
      patient: { select: { id: true, patientId: true, name: true, contactNumber: true } },
      doctor: { select: { id: true, doctorId: true, name: true, specialization: true } },
    },
  });
};

const cancelAppointment = async (id) => {
  const numericId = parseId(id);
  const existing = await prisma.appointment.findUnique({ where: { id: numericId } });
  if (!existing) {
    const err = new Error('Appointment not found');
    err.status = 404;
    throw err;
  }
  if (existing.status === 'CANCELLED') {
    const err = new Error('Appointment is already cancelled');
    err.status = 400;
    throw err;
  }

  return prisma.appointment.update({
    where: { id: numericId },
    data: { status: 'CANCELLED' },
    include: {
      patient: { select: { id: true, patientId: true, name: true } },
      doctor: { select: { id: true, doctorId: true, name: true } },
    },
  });
};

module.exports = {
  getAllAppointments,
  getAppointmentById,
  createAppointment,
  updateAppointment,
  cancelAppointment,
};
