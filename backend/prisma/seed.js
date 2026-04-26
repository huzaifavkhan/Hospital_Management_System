require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  if (process.env.NODE_ENV === 'production') {
    console.warn('Seed script is disabled in production.');
    return;
  }

  const adminPassword = process.env.SEED_ADMIN_PASSWORD;
  const receptionistPassword = process.env.SEED_RECEPTIONIST_PASSWORD;
  if (!adminPassword || !receptionistPassword) {
    throw new Error('SEED_ADMIN_PASSWORD and SEED_RECEPTIONIST_PASSWORD are required.');
  }

  console.log('Seeding users...');

  const adminUsername = process.env.SEED_ADMIN_USERNAME || 'admin';
  await prisma.user.upsert({
    where: { username: adminUsername },
    update: {},
    create: {
      username: adminUsername,
      password: await bcrypt.hash(adminPassword, 10),
      fullName: 'Dr. Sarah Mitchell',
      role: 'ADMIN',
      isActive: true,
      email: 'huzaifaahmed581@gmail.com',
    },
  });

  const recepUsername = process.env.SEED_RECEPTIONIST_USERNAME || 'receptionist';
  await prisma.user.upsert({
    where: { username: recepUsername },
    update: {},
    create: {
      username: recepUsername,
      password: await bcrypt.hash(receptionistPassword, 10),
      fullName: 'Emily Carter',
      role: 'RECEPTIONIST',
      isActive: true,
      email: 'emily.carter@citygeneralhospital.com',
    },
  });

  await prisma.user.upsert({
    where: { username: 'reception2' },
    update: {},
    create: {
      username: 'reception2',
      password: await bcrypt.hash(receptionistPassword, 10),
      fullName: 'James Thornton',
      role: 'RECEPTIONIST',
      isActive: true,
      email: 'james.thornton@citygeneralhospital.com',
    },
  });

  console.log('Seeding hospital settings...');

  const settings = [
    { key: 'hospital_name',    value: 'City General Hospital' },
    { key: 'hospital_contact', value: '+1 (555) 200-4900' },
    { key: 'hospital_address', value: '742 Evergreen Medical Park, Springfield, IL 62701' },
    { key: 'hospital_email',   value: 'admin@citygeneralhospital.com' },
  ];
  for (const s of settings) {
    await prisma.hospitalSettings.upsert({ where: { key: s.key }, update: {}, create: s });
  }

  console.log('Seeding departments...');

  const deptData = [
    { name: 'Cardiology',       description: 'Heart and cardiovascular system disorders' },
    { name: 'Neurology',        description: 'Brain, spinal cord and nervous system conditions' },
    { name: 'Orthopedics',      description: 'Musculoskeletal system, bones and joints' },
    { name: 'Pediatrics',       description: 'Medical care for infants, children and adolescents' },
    { name: 'General Medicine', description: 'Primary care and internal medicine' },
    { name: 'Dermatology',      description: 'Skin, hair and nail conditions' },
    { name: 'Oncology',         description: 'Diagnosis and treatment of cancer' },
    { name: 'Radiology',        description: 'Medical imaging and diagnostic radiology' },
  ];
  const depts = {};
  for (const d of deptData) {
    const dept = await prisma.department.upsert({ where: { name: d.name }, update: {}, create: d });
    depts[d.name] = dept;
  }

  console.log('Seeding doctors...');

  const weekdaySchedule = {
    monday:    { start: '09:00', end: '17:00' },
    tuesday:   { start: '09:00', end: '17:00' },
    wednesday: { start: '09:00', end: '17:00' },
    thursday:  { start: '09:00', end: '17:00' },
    friday:    { start: '09:00', end: '15:00' },
  };
  const altSchedule = {
    monday:    { start: '08:00', end: '16:00' },
    tuesday:   { start: '08:00', end: '16:00' },
    wednesday: { start: '12:00', end: '20:00' },
    thursday:  { start: '08:00', end: '16:00' },
    saturday:  { start: '09:00', end: '13:00' },
  };
  const eveningSchedule = {
    tuesday:   { start: '14:00', end: '20:00' },
    wednesday: { start: '14:00', end: '20:00' },
    thursday:  { start: '14:00', end: '20:00' },
    friday:    { start: '09:00', end: '17:00' },
    saturday:  { start: '09:00', end: '14:00' },
  };

  const doctorData = [
    { doctorId: 'DOC001', name: 'Dr. James Harrington',  specialization: 'Interventional Cardiology', contactNumber: '+1 (555) 301-1001', departmentId: depts['Cardiology'].id,       availabilitySchedule: weekdaySchedule },
    { doctorId: 'DOC002', name: 'Dr. Priya Nair',         specialization: 'Electrophysiology',         contactNumber: '+1 (555) 301-1002', departmentId: depts['Cardiology'].id,       availabilitySchedule: altSchedule },
    { doctorId: 'DOC003', name: 'Dr. Alan Foster',        specialization: 'Stroke Neurology',          contactNumber: '+1 (555) 302-2001', departmentId: depts['Neurology'].id,        availabilitySchedule: weekdaySchedule },
    { doctorId: 'DOC004', name: 'Dr. Yuki Tanaka',        specialization: 'Epileptology',              contactNumber: '+1 (555) 302-2002', departmentId: depts['Neurology'].id,        availabilitySchedule: eveningSchedule },
    { doctorId: 'DOC005', name: 'Dr. Robert Walsh',       specialization: 'Joint Replacement Surgery', contactNumber: '+1 (555) 303-3001', departmentId: depts['Orthopedics'].id,     availabilitySchedule: weekdaySchedule },
    { doctorId: 'DOC006', name: 'Dr. Amara Osei',         specialization: 'Spine Surgery',             contactNumber: '+1 (555) 303-3002', departmentId: depts['Orthopedics'].id,     availabilitySchedule: altSchedule },
    { doctorId: 'DOC007', name: 'Dr. Linda Park',         specialization: 'Neonatology',               contactNumber: '+1 (555) 304-4001', departmentId: depts['Pediatrics'].id,      availabilitySchedule: weekdaySchedule },
    { doctorId: 'DOC008', name: 'Dr. Carlos Mendez',      specialization: 'Pediatric Cardiology',      contactNumber: '+1 (555) 304-4002', departmentId: depts['Pediatrics'].id,      availabilitySchedule: eveningSchedule },
    { doctorId: 'DOC009', name: 'Dr. Helen Brooks',       specialization: 'Internal Medicine',         contactNumber: '+1 (555) 305-5001', departmentId: depts['General Medicine'].id, availabilitySchedule: weekdaySchedule },
    { doctorId: 'DOC010', name: 'Dr. Omar Sheikh',        specialization: 'Geriatric Medicine',        contactNumber: '+1 (555) 305-5002', departmentId: depts['General Medicine'].id, availabilitySchedule: altSchedule },
    { doctorId: 'DOC011', name: 'Dr. Sophie Laurent',     specialization: 'Clinical Dermatology',      contactNumber: '+1 (555) 306-6001', departmentId: depts['Dermatology'].id,     availabilitySchedule: weekdaySchedule },
    { doctorId: 'DOC012', name: 'Dr. Marcus Reid',        specialization: 'Dermato-oncology',          contactNumber: '+1 (555) 306-6002', departmentId: depts['Dermatology'].id,     availabilitySchedule: eveningSchedule },
    { doctorId: 'DOC013', name: 'Dr. Fatima Al-Rashid',   specialization: 'Medical Oncology',          contactNumber: '+1 (555) 307-7001', departmentId: depts['Oncology'].id,        availabilitySchedule: weekdaySchedule },
    { doctorId: 'DOC014', name: 'Dr. Nathan Cole',        specialization: 'Radiation Oncology',        contactNumber: '+1 (555) 307-7002', departmentId: depts['Oncology'].id,        availabilitySchedule: altSchedule },
    { doctorId: 'DOC015', name: 'Dr. Ingrid Svensson',    specialization: 'Interventional Radiology',  contactNumber: '+1 (555) 308-8001', departmentId: depts['Radiology'].id,       availabilitySchedule: weekdaySchedule },
  ];

  const doctors = {};
  for (const d of doctorData) {
    const doc = await prisma.doctor.upsert({
      where: { doctorId: d.doctorId },
      update: {},
      create: d,
    });
    doctors[d.doctorId] = doc;
  }

  console.log('Seeding patients...');

  const patientData = [
    { patientId: 'PAT001', name: 'Thomas Anderson',    age: 54, gender: 'Male',   contactNumber: '+1 (555) 401-0001', address: '12 Maple Street, Springfield, IL',     medicalHistory: 'Hypertension, Type 2 Diabetes mellitus diagnosed 2018. Family history of coronary artery disease.' },
    { patientId: 'PAT002', name: 'Grace Liu',           age: 38, gender: 'Female', contactNumber: '+1 (555) 401-0002', address: '47 Oak Avenue, Chicago, IL',           medicalHistory: 'Migraine disorder, Iron-deficiency anaemia. Allergic to penicillin.' },
    { patientId: 'PAT003', name: 'Samuel Okafor',       age: 61, gender: 'Male',   contactNumber: '+1 (555) 401-0003', address: '8 Birch Lane, Peoria, IL',             medicalHistory: 'COPD Stage II, Atrial fibrillation. Ex-smoker (40 pack-years).' },
    { patientId: 'PAT004', name: 'Maria Rodriguez',     age: 45, gender: 'Female', contactNumber: '+1 (555) 401-0004', address: '33 Cedar Road, Rockford, IL',          medicalHistory: 'Rheumatoid arthritis since 2015. On methotrexate. No known drug allergies.' },
    { patientId: 'PAT005', name: 'Kevin Patel',         age: 29, gender: 'Male',   contactNumber: '+1 (555) 401-0005', address: '91 Elm Court, Naperville, IL',         medicalHistory: 'Epilepsy (partial seizures) diagnosed 2020. On levetiracetam 1000mg BD.' },
    { patientId: 'PAT006', name: 'Dorothy Chang',       age: 72, gender: 'Female', contactNumber: '+1 (555) 401-0006', address: '5 Willow Drive, Joliet, IL',           medicalHistory: 'Osteoporosis, Hypothyroidism, History of hip fracture (2021). On bisphosphonate therapy.' },
    { patientId: 'PAT007', name: 'Brandon Williams',    age: 8,  gender: 'Male',   contactNumber: '+1 (555) 401-0007', address: '22 Pine Street, Aurora, IL',           medicalHistory: 'Asthma (mild persistent). Seasonal allergies. Mother has history of eczema.' },
    { patientId: 'PAT008', name: 'Sophia Evans',        age: 33, gender: 'Female', contactNumber: '+1 (555) 401-0008', address: '66 Ash Boulevard, Elgin, IL',          medicalHistory: 'Polycystic ovary syndrome (PCOS), Anxiety disorder. No surgical history.' },
    { patientId: 'PAT009', name: 'Frank Morrison',      age: 58, gender: 'Male',   contactNumber: '+1 (555) 401-0009', address: '14 Poplar Way, Waukegan, IL',          medicalHistory: 'Non-Hodgkin lymphoma (remission 2022). Post-chemotherapy neuropathy.' },
    { patientId: 'PAT010', name: 'Aisha Malik',         age: 41, gender: 'Female', contactNumber: '+1 (555) 401-0010', address: '78 Spruce Circle, Champaign, IL',      medicalHistory: 'Stage II breast cancer diagnosed 2023. Currently on adjuvant chemotherapy.' },
    { patientId: 'PAT011', name: 'George Turner',       age: 67, gender: 'Male',   contactNumber: '+1 (555) 401-0011', address: '3 Hickory Lane, Decatur, IL',          medicalHistory: 'Ischaemic heart disease. Two previous MIs (2016, 2020). On aspirin, atorvastatin, bisoprolol.' },
    { patientId: 'PAT012', name: 'Nina Kowalski',       age: 26, gender: 'Female', contactNumber: '+1 (555) 401-0012', address: '55 Sycamore Road, Evanston, IL',       medicalHistory: 'Psoriasis (moderate plaque). On topical corticosteroids. No systemic therapy yet.' },
    { patientId: 'PAT013', name: 'Hassan Al-Farsi',     age: 50, gender: 'Male',   contactNumber: '+1 (555) 401-0013', address: '19 Magnolia Terrace, Bloomington, IL', medicalHistory: 'Lumbar disc herniation L4-L5. Chronic lower back pain. Failed conservative management x2.' },
    { patientId: 'PAT014', name: 'Clara Novak',         age: 35, gender: 'Female', contactNumber: '+1 (555) 401-0014', address: '40 Chestnut Place, Normal, IL',        medicalHistory: 'Gestational diabetes (previous pregnancy 2021). BMI 31. Pre-diabetic on lifestyle management.' },
    { patientId: 'PAT015', name: 'Raymond Brooks',      age: 77, gender: 'Male',   contactNumber: '+1 (555) 401-0015', address: '11 Walnut Avenue, Galesburg, IL',      medicalHistory: 'Parkinson\'s disease Stage III, Dementia (early). On levodopa-carbidopa.' },
    { patientId: 'PAT016', name: 'Lily Zhao',           age: 14, gender: 'Female', contactNumber: '+1 (555) 401-0016', address: '88 Beech Street, Quincy, IL',          medicalHistory: 'Type 1 diabetes mellitus since age 9. On insulin pump. Regular ophthalmology review.' },
    { patientId: 'PAT017', name: 'Derek Simmons',       age: 43, gender: 'Male',   contactNumber: '+1 (555) 401-0017', address: '27 Alder Court, Pekin, IL',            medicalHistory: 'Melanoma stage IIA excised 2022. Annual dermatoscopy surveillance. No recurrence to date.' },
    { patientId: 'PAT018', name: 'Patricia Collins',    age: 59, gender: 'Female', contactNumber: '+1 (555) 401-0018', address: '62 Juniper Road, Kankakee, IL',        medicalHistory: 'Osteoarthritis bilateral knees, Hyperlipidaemia. Awaiting right knee replacement.' },
    { patientId: 'PAT019', name: 'Ethan Nguyen',        age: 22, gender: 'Male',   contactNumber: '+1 (555) 401-0019', address: '34 Redwood Street, Urbana, IL',        medicalHistory: 'First unprovoked seizure October 2024. MRI normal. Awaiting EEG. No prior neurological history.' },
    { patientId: 'PAT020', name: 'Margaret Stewart',    age: 65, gender: 'Female', contactNumber: '+1 (555) 401-0020', address: '16 Cottonwood Drive, Danville, IL',    medicalHistory: 'Ovarian cancer (remission 2021). Annual CA-125 monitoring. Chronic fatigue post-treatment.' },
    { patientId: 'PAT021', name: 'Oliver Grant',        age: 48, gender: 'Male',   contactNumber: '+1 (555) 401-0021', address: '73 Ironwood Lane, Carbondale, IL',     medicalHistory: 'Hypertension, Sleep apnoea on CPAP. BMI 34. Mildly elevated ALT — under monitoring.' },
    { patientId: 'PAT022', name: 'Vanessa Torres',      age: 31, gender: 'Female', contactNumber: '+1 (555) 401-0022', address: '9 Cypress Avenue, Belleville, IL',     medicalHistory: 'Systemic lupus erythematosus (SLE). On hydroxychloroquine. Allergic to sulphonamides.' },
    { patientId: 'PAT023', name: 'Arthur Fleming',      age: 70, gender: 'Male',   contactNumber: '+1 (555) 401-0023', address: '50 Dogwood Road, Alton, IL',           medicalHistory: 'Prostate cancer (localised, watchful waiting). BPH. On dutasteride.' },
    { patientId: 'PAT024', name: 'Chloe Bennett',       age: 5,  gender: 'Female', contactNumber: '+1 (555) 401-0024', address: '30 Larch Court, Moline, IL',           medicalHistory: 'Recurrent otitis media. Adenoid hypertrophy. Awaiting ENT referral.' },
    { patientId: 'PAT025', name: 'William Nakamura',    age: 55, gender: 'Male',   contactNumber: '+1 (555) 401-0025', address: '45 Persimmon Place, Rock Island, IL',  medicalHistory: 'Chronic kidney disease Stage 3. Diabetic nephropathy. On ACE inhibitor and dietary restriction.' },
  ];

  const patients = {};
  for (const p of patientData) {
    const pat = await prisma.patient.upsert({
      where: { patientId: p.patientId },
      update: {},
      create: p,
    });
    patients[p.patientId] = pat;
  }

  console.log('Assigning doctors to patients...');

  const assignments = [
    ['PAT001', 'DOC001'], ['PAT001', 'DOC009'],
    ['PAT002', 'DOC003'], ['PAT002', 'DOC009'],
    ['PAT003', 'DOC001'], ['PAT003', 'DOC009'],
    ['PAT004', 'DOC005'], ['PAT004', 'DOC009'],
    ['PAT005', 'DOC004'], ['PAT005', 'DOC003'],
    ['PAT006', 'DOC006'], ['PAT006', 'DOC010'],
    ['PAT007', 'DOC007'], ['PAT007', 'DOC008'],
    ['PAT008', 'DOC009'], ['PAT008', 'DOC011'],
    ['PAT009', 'DOC013'],
    ['PAT010', 'DOC013'], ['PAT010', 'DOC014'],
    ['PAT011', 'DOC001'], ['PAT011', 'DOC002'],
    ['PAT012', 'DOC011'], ['PAT012', 'DOC012'],
    ['PAT013', 'DOC006'], ['PAT013', 'DOC005'],
    ['PAT014', 'DOC009'], ['PAT014', 'DOC010'],
    ['PAT015', 'DOC003'], ['PAT015', 'DOC010'],
    ['PAT016', 'DOC007'], ['PAT016', 'DOC008'],
    ['PAT017', 'DOC012'], ['PAT017', 'DOC011'],
    ['PAT018', 'DOC005'], ['PAT018', 'DOC010'],
    ['PAT019', 'DOC004'], ['PAT019', 'DOC003'],
    ['PAT020', 'DOC013'], ['PAT020', 'DOC014'],
    ['PAT021', 'DOC001'], ['PAT021', 'DOC009'],
    ['PAT022', 'DOC009'], ['PAT022', 'DOC011'],
    ['PAT023', 'DOC013'], ['PAT023', 'DOC010'],
    ['PAT024', 'DOC007'],
    ['PAT025', 'DOC009'], ['PAT025', 'DOC010'],
  ];
  for (const [pid, did] of assignments) {
    await prisma.patientDoctor.upsert({
      where: { patientId_doctorId: { patientId: patients[pid].id, doctorId: doctors[did].id } },
      update: {},
      create: { patientId: patients[pid].id, doctorId: doctors[did].id },
    });
  }

  console.log('Seeding visits...');

  const visitData = [
    { pat: 'PAT001', doc: 'DOC001', visitDate: '2024-11-05T09:30:00Z', diagnosis: 'Hypertensive crisis',                summary: 'BP 180/110 on arrival. IV labetalol administered. Switched amlodipine to nifedipine SR 30mg. 24-hour BP monitoring arranged. Patient counselled on sodium restriction and medication adherence.' },
    { pat: 'PAT001', doc: 'DOC001', visitDate: '2025-01-20T10:00:00Z', diagnosis: 'Stable angina — follow-up',          summary: 'Exercise tolerance improved since dose adjustment. GTN spray used twice last month. ECG unchanged. Continued bisoprolol 5mg, added isosorbide mononitrate 30mg OD. Stress echo booked.' },
    { pat: 'PAT001', doc: 'DOC009', visitDate: '2025-03-10T11:00:00Z', diagnosis: 'Type 2 diabetes — quarterly review', summary: 'HbA1c 7.4% (improved from 8.1%). eGFR stable at 68. Weight down 3kg since last visit. Metformin continued; SGLT2 inhibitor added. Dietitian referral made.' },
    { pat: 'PAT002', doc: 'DOC003', visitDate: '2024-10-14T14:00:00Z', diagnosis: 'Migraine with aura',                 summary: 'Cluster of 3 severe attacks in past fortnight with visual aura and photophobia. Sumatriptan 50mg effective. Propranolol 40mg BD added as prophylaxis. MRI head requested to exclude secondary cause.' },
    { pat: 'PAT002', doc: 'DOC003', visitDate: '2025-02-06T09:00:00Z', diagnosis: 'Migraine — prophylaxis review',      summary: 'Frequency reduced to 1 attack/month on propranolol. Tolerating well, no side-effects reported. MRI head: normal. Continue current regimen. Patient encouraged to maintain headache diary.' },
    { pat: 'PAT003', doc: 'DOC001', visitDate: '2024-12-03T08:30:00Z', diagnosis: 'Atrial fibrillation — rate control', summary: 'Persistent AF on 12-lead ECG. Rate 110bpm at rest. Digoxin added alongside bisoprolol. INR 2.4 on warfarin — therapeutic. CHA₂DS₂-VASc score 4. Echocardiogram scheduled for next month.' },
    { pat: 'PAT004', doc: 'DOC005', visitDate: '2024-09-18T13:00:00Z', diagnosis: 'Rheumatoid arthritis flare — right knee', summary: 'Significant synovitis right knee. Aspirated 18ml turbid fluid. Intra-articular triamcinolone 40mg injected. Physiotherapy referral issued. Methotrexate dose increased to 20mg weekly.' },
    { pat: 'PAT004', doc: 'DOC005', visitDate: '2025-01-09T10:30:00Z', diagnosis: 'Post-injection review',              summary: 'Good symptomatic response to steroid injection. ROM improved. CRP down from 44 to 12. Continuing methotrexate 20mg weekly and hydroxychloroquine 400mg OD. Repeat DXA scan arranged.' },
    { pat: 'PAT005', doc: 'DOC004', visitDate: '2024-08-22T15:00:00Z', diagnosis: 'Epilepsy — seizure breakthrough',    summary: 'Two breakthrough seizures over 3 weeks, both preceded by sleep deprivation. Levetiracetam dose increased to 1500mg BD. Sleep hygiene advice given. EEG repeated — no new epileptiform activity. Driving restrictions discussed.' },
    { pat: 'PAT005', doc: 'DOC004', visitDate: '2025-03-01T14:00:00Z', diagnosis: 'Epilepsy — stable',                  summary: 'Seizure-free for 7 months. Sodium valproate considered unnecessary at this stage. Continuing levetiracetam 1500mg BD. Discussed potential for licence reinstatement after 12 seizure-free months.' },
    { pat: 'PAT006', doc: 'DOC006', visitDate: '2024-11-28T09:00:00Z', diagnosis: 'Vertebral compression fracture T12',  summary: 'Acute onset back pain following minor fall. X-ray confirms T12 compression fracture. DEXA T-score −3.2. Started zoledronic acid infusion. Referred to spinal physio. Calcium and vitamin D supplementation increased.' },
    { pat: 'PAT007', doc: 'DOC007', visitDate: '2025-01-15T10:00:00Z', diagnosis: 'Asthma — uncontrolled',             summary: 'Using salbutamol 4–5 times/week. Nocturnal cough disrupting sleep. Step-up to ICS/LABA (fluticasone/salmeterol) initiated. Spacer technique reviewed with parent. Written asthma action plan provided.' },
    { pat: 'PAT008', doc: 'DOC011', visitDate: '2024-10-07T11:00:00Z', diagnosis: 'Acne vulgaris — moderate',           summary: 'Moderate inflammatory acne face and upper back. Topical clindamycin + benzoyl peroxide combination prescribed. Oral doxycycline 100mg OD for 12 weeks. Reviewed skincare routine and advised on sun protection.' },
    { pat: 'PAT009', doc: 'DOC013', visitDate: '2025-02-20T09:30:00Z', diagnosis: 'Non-Hodgkin lymphoma — surveillance', summary: 'Annual CT chest/abdomen/pelvis: no evidence of recurrence. LDH and beta-2 microglobulin normal. Patient remains in complete remission at 30 months post-RCHOP. Next surveillance in 12 months.' },
    { pat: 'PAT010', doc: 'DOC013', visitDate: '2024-09-05T13:00:00Z', diagnosis: 'Breast cancer — chemotherapy cycle 3', summary: 'AC chemotherapy cycle 3 administered. Grade 2 nausea managed with ondansetron. Neutrophils 1.8 — borderline, growth factor support commenced. Hair loss noted; patient referred to psycho-oncology support group.' },
    { pat: 'PAT010', doc: 'DOC013', visitDate: '2024-12-10T10:00:00Z', diagnosis: 'Breast cancer — post-chemo review',  summary: 'Completed 4 cycles AC + 4 cycles taxane. Repeat staging MRI shows partial response with 40% reduction in primary lesion. Referred to surgical oncology for consideration of breast-conserving surgery.' },
    { pat: 'PAT011', doc: 'DOC001', visitDate: '2024-07-14T08:00:00Z', diagnosis: 'Acute STEMI — post-discharge follow-up', summary: 'Discharged 5 days ago following primary PCI to LAD. LVEF 45% on discharge echo. Commenced dual antiplatelet, ACE inhibitor, beta-blocker, high-intensity statin. Cardiac rehab enrolment confirmed. Driving restrictions for 4 weeks.' },
    { pat: 'PAT011', doc: 'DOC001', visitDate: '2025-01-30T09:00:00Z', diagnosis: 'Post-MI 6-month follow-up',          summary: 'LVEF improved to 52% on repeat echo. Symptoms: NYHA Class I. DAPT continued (clopidogrel). No angina reported. Statin LDL 1.4 mmol/L — at target. Annual stress test planned.' },
    { pat: 'PAT012', doc: 'DOC011', visitDate: '2024-11-11T14:00:00Z', diagnosis: 'Plaque psoriasis — moderate',        summary: 'PASI score 12.4. Inadequate response to topical therapy alone. Introduced narrowband UVB phototherapy 3× weekly. Counselled on treatment duration (8–12 weeks). Dermatology life quality index 14 — significant impact.' },
    { pat: 'PAT013', doc: 'DOC006', visitDate: '2024-10-25T10:00:00Z', diagnosis: 'Lumbar disc herniation — pre-op assessment', summary: 'Persistent S1 radiculopathy despite 6 weeks physiotherapy and NSAIDs. Straight leg raise positive at 40°. MRI confirms large L4-L5 protrusion with nerve root compression. Consented for microdiscectomy. Anaesthetics review arranged.' },
    { pat: 'PAT014', doc: 'DOC009', visitDate: '2025-02-14T11:00:00Z', diagnosis: 'Pre-diabetes — lifestyle review',    summary: 'Fasting glucose 6.3 mmol/L; HbA1c 42 mmol/mol. Weight 83kg (−2kg since last visit). Walking 30 min/day — good. Discussed structured education programme. Repeat bloods in 6 months. Metformin deferred pending further weight loss.' },
    { pat: 'PAT015', doc: 'DOC003', visitDate: '2024-12-19T09:00:00Z', diagnosis: "Parkinson's disease — motor review",  summary: 'Worsening bradykinesia and resting tremor right hand. Levodopa dose increased to 250mg TDS. Physiotherapy and speech therapy referrals renewed. Hallucinations reported — quetiapine 12.5mg nocte added cautiously. Carer support discussed.' },
    { pat: 'PAT016', doc: 'DOC007', visitDate: '2025-01-08T10:00:00Z', diagnosis: 'Type 1 diabetes — HbA1c review',    summary: 'HbA1c 6.8% — excellent control. No hypoglycaemic episodes in past 3 months. Pump settings reviewed and adjusted for school schedule. Ophthalmology annual review completed — no retinopathy. Growth percentile 65th — appropriate.' },
    { pat: 'PAT017', doc: 'DOC012', visitDate: '2024-06-30T14:30:00Z', diagnosis: 'Melanoma surveillance',             summary: 'Annual full-body dermoscopy completed. No suspicious lesions identified. Excision scar well-healed. Patient counselled on sun protection SPF50+, avoiding tanning beds. Repeat surveillance in 12 months. SentinelNode negative at time of excision.' },
    { pat: 'PAT018', doc: 'DOC005', visitDate: '2025-03-05T08:30:00Z', diagnosis: 'Pre-operative knee assessment',      summary: 'Right total knee replacement planned for April 2025. Weight 89kg, BMI 32. Anaesthetic review booked. Physiotherapy pre-hab commenced. Discussed implant options and expected recovery timeline. DVT prophylaxis protocol explained.' },
    { pat: 'PAT019', doc: 'DOC004', visitDate: '2025-02-28T15:00:00Z', diagnosis: 'First seizure — evaluation',         summary: 'Full neurological examination normal. MRI brain normal. EEG performed today — pending report. Social history: sleep-deprived student, caffeine excess. Driving ban advised. No AED started pending EEG result. Review in 4 weeks.' },
    { pat: 'PAT020', doc: 'DOC013', visitDate: '2025-01-22T10:00:00Z', diagnosis: 'Ovarian cancer — annual review',     summary: 'CA-125 9 U/mL (normal). CT abdomen/pelvis: no recurrence. Patient fatigued — haematinics checked, B12 low; supplemented. Sleep hygiene counselled. Psycho-oncology follow-up recommended. Next annual review booked.' },
    { pat: 'PAT021', doc: 'DOC001', visitDate: '2024-08-15T09:00:00Z', diagnosis: 'Hypertension management',           summary: 'BP 148/92 despite amlodipine 10mg. Added perindopril 4mg. ABPM arranged. Liver function normal. Advised weight reduction and alcohol moderation. Sleep study referral for obstructive sleep apnoea confirmed.' },
    { pat: 'PAT022', doc: 'DOC009', visitDate: '2024-12-05T14:00:00Z', diagnosis: 'SLE — flare assessment',            summary: 'New malar rash, arthralgia, fatigue. Anti-dsDNA titre elevated 1:320. Hydroxychloroquine dose maintained. Prednisolone 20mg course initiated for 4 weeks with taper. Renal function, urinalysis, and complement levels checked.' },
    { pat: 'PAT023', doc: 'DOC013', visitDate: '2025-01-10T10:30:00Z', diagnosis: 'Prostate cancer — PSA monitoring',  summary: 'PSA 4.8 ng/mL (stable from 4.6 last year). Watchful waiting continued. DRE: symmetrically enlarged prostate, no nodules. Bone scan not indicated. Quality-of-life questionnaire completed — no significant urinary symptoms. Review in 12 months.' },
    { pat: 'PAT024', doc: 'DOC007', visitDate: '2025-02-03T11:30:00Z', diagnosis: 'Recurrent otitis media',            summary: 'Fifth episode in 12 months. Bilateral hearing screening — mild conductive loss. ENT referral submitted. Amoxicillin prescribed for current infection. Parents educated on decongestant avoidance and positioning during feeds.' },
    { pat: 'PAT025', doc: 'DOC009', visitDate: '2024-11-20T09:00:00Z', diagnosis: 'CKD Stage 3 — nephrology review',   summary: 'eGFR 42 (stable). BP 128/78 on ramipril 10mg. Phosphate 1.3 mmol/L — borderline; dietary counselling reinforced. Haemoglobin 110g/L — iron infusion scheduled. Anaemia of CKD confirmed. Erythropoiesis-stimulating agent considered.' },
  ];

  const visits = [];
  for (const v of visitData) {
    const visit = await prisma.visit.create({
      data: {
        patientId: patients[v.pat].id,
        doctorId:  doctors[v.doc].id,
        visitDate: new Date(v.visitDate),
        diagnosis: v.diagnosis,
        summary:   v.summary,
      },
    });
    visits.push(visit);
  }

  console.log('Seeding appointments...');

  const now = new Date();
  const d = (offsetDays, hour = 9, minute = 0) => {
    const dt = new Date(now);
    dt.setDate(dt.getDate() + offsetDays);
    dt.setHours(hour, minute, 0, 0);
    return dt;
  };

  let aptCounter = 1;
  const aptId = () => `APT${String(aptCounter++).padStart(3, '0')}`;

  const appointmentData = [
    // Past — COMPLETED
    { id: aptId(), pat: 'PAT001', doc: 'DOC001', dt: d(-60, 9, 0),  status: 'COMPLETED',    notes: 'Annual cardiac review. ECG and echo performed.' },
    { id: aptId(), pat: 'PAT002', doc: 'DOC003', dt: d(-55, 10, 30), status: 'COMPLETED',   notes: 'Migraine management discussion. MRI results reviewed.' },
    { id: aptId(), pat: 'PAT003', doc: 'DOC001', dt: d(-50, 11, 0),  status: 'COMPLETED',   notes: 'Atrial fibrillation rate review. Warfarin dose adjusted.' },
    { id: aptId(), pat: 'PAT004', doc: 'DOC005', dt: d(-45, 9, 30),  status: 'COMPLETED',   notes: 'Rheumatoid arthritis follow-up. Joint injections administered.' },
    { id: aptId(), pat: 'PAT005', doc: 'DOC004', dt: d(-40, 14, 0),  status: 'COMPLETED',   notes: 'Epilepsy medication review. Dose increased per protocol.' },
    { id: aptId(), pat: 'PAT009', doc: 'DOC013', dt: d(-38, 10, 0),  status: 'COMPLETED',   notes: 'Lymphoma surveillance CT results discussed.' },
    { id: aptId(), pat: 'PAT010', doc: 'DOC013', dt: d(-35, 13, 0),  status: 'COMPLETED',   notes: 'Chemotherapy cycle 4 — AC regime. Bloods reviewed pre-treatment.' },
    { id: aptId(), pat: 'PAT011', doc: 'DOC001', dt: d(-30, 8, 0),   status: 'COMPLETED',   notes: 'Post-MI 3-month review. Repeat echo arranged.' },
    { id: aptId(), pat: 'PAT012', doc: 'DOC011', dt: d(-28, 14, 0),  status: 'COMPLETED',   notes: 'Psoriasis PASI scoring. UVB phototherapy progress assessed.' },
    { id: aptId(), pat: 'PAT015', doc: 'DOC003', dt: d(-25, 9, 0),   status: 'COMPLETED',   notes: "Parkinson's motor review. Levodopa titration." },
    { id: aptId(), pat: 'PAT016', doc: 'DOC007', dt: d(-20, 10, 0),  status: 'COMPLETED',   notes: 'Paediatric diabetes clinic — HbA1c and growth assessment.' },
    { id: aptId(), pat: 'PAT018', doc: 'DOC005', dt: d(-15, 8, 30),  status: 'COMPLETED',   notes: 'Pre-operative knee assessment completed. Surgery date confirmed.' },
    { id: aptId(), pat: 'PAT020', doc: 'DOC013', dt: d(-12, 10, 0),  status: 'COMPLETED',   notes: 'Annual oncology surveillance — CA-125 and CT results reviewed.' },
    { id: aptId(), pat: 'PAT022', doc: 'DOC009', dt: d(-10, 14, 0),  status: 'COMPLETED',   notes: 'SLE flare review. Prednisolone taper plan confirmed.' },
    { id: aptId(), pat: 'PAT025', doc: 'DOC009', dt: d(-8, 9, 0),    status: 'COMPLETED',   notes: 'CKD quarterly review. Iron infusion scheduled.' },
    { id: aptId(), pat: 'PAT007', doc: 'DOC007', dt: d(-7, 11, 0),   status: 'COMPLETED',   notes: 'Paediatric asthma step-up review. Inhaler technique reassessed.' },
    { id: aptId(), pat: 'PAT014', doc: 'DOC009', dt: d(-5, 11, 0),   status: 'COMPLETED',   notes: 'Pre-diabetes follow-up. Fasting glucose repeat.' },
    // Past — CANCELLED
    { id: aptId(), pat: 'PAT006', doc: 'DOC006', dt: d(-22, 9, 0),   status: 'CANCELLED',   notes: 'Patient unwell — rescheduled.' },
    { id: aptId(), pat: 'PAT008', doc: 'DOC011', dt: d(-18, 14, 30), status: 'CANCELLED',   notes: 'No-show. Patient contacted; new appointment booked.' },
    { id: aptId(), pat: 'PAT023', doc: 'DOC013', dt: d(-14, 10, 30), status: 'CANCELLED',   notes: 'Clinician leave — appointment rescheduled.' },
    // Past — RESCHEDULED
    { id: aptId(), pat: 'PAT013', doc: 'DOC006', dt: d(-9, 8, 30),   status: 'RESCHEDULED', notes: 'Pre-op consent session rescheduled from original date.' },
    { id: aptId(), pat: 'PAT019', doc: 'DOC004', dt: d(-3, 15, 0),   status: 'RESCHEDULED', notes: 'EEG review rescheduled — patient requested later date.' },
    // Today / very soon — SCHEDULED
    { id: aptId(), pat: 'PAT001', doc: 'DOC009', dt: d(0, 9, 30),    status: 'SCHEDULED',   notes: 'Diabetes HbA1c review and medication adjustment.' },
    { id: aptId(), pat: 'PAT003', doc: 'DOC002', dt: d(0, 11, 0),    status: 'SCHEDULED',   notes: 'Holter monitor results review for AF burden assessment.' },
    { id: aptId(), pat: 'PAT011', doc: 'DOC002', dt: d(1, 9, 0),     status: 'SCHEDULED',   notes: 'EP study referral discussion — recurrent palpitations.' },
    { id: aptId(), pat: 'PAT024', doc: 'DOC007', dt: d(1, 11, 30),   status: 'SCHEDULED',   notes: 'Paediatric ENT referral follow-up — hearing test results.' },
    { id: aptId(), pat: 'PAT017', doc: 'DOC012', dt: d(2, 14, 0),    status: 'SCHEDULED',   notes: 'Annual dermoscopy surveillance — full body examination.' },
    { id: aptId(), pat: 'PAT008', doc: 'DOC009', dt: d(2, 15, 0),    status: 'SCHEDULED',   notes: 'PCOS annual review — metabolic panel and ultrasound results.' },
    { id: aptId(), pat: 'PAT006', doc: 'DOC006', dt: d(3, 9, 0),     status: 'SCHEDULED',   notes: 'Zoledronic acid infusion follow-up. DEXA scan results review.' },
    { id: aptId(), pat: 'PAT013', doc: 'DOC006', dt: d(4, 10, 0),    status: 'SCHEDULED',   notes: 'Post-microdiscectomy 6-week review. Physiotherapy progress.' },
    { id: aptId(), pat: 'PAT021', doc: 'DOC001', dt: d(4, 9, 0),     status: 'SCHEDULED',   notes: 'ABPM results review. Secondary hypertension workup.' },
    { id: aptId(), pat: 'PAT015', doc: 'DOC010', dt: d(5, 14, 0),    status: 'SCHEDULED',   notes: 'Geriatric assessment — cognition and functional status.' },
    { id: aptId(), pat: 'PAT002', doc: 'DOC009', dt: d(6, 10, 0),    status: 'SCHEDULED',   notes: 'Iron infusion post iron-deficiency anaemia workup.' },
    { id: aptId(), pat: 'PAT010', doc: 'DOC014', dt: d(7, 13, 0),    status: 'SCHEDULED',   notes: 'Radiation oncology planning consultation — post-surgical adjuvant.' },
    { id: aptId(), pat: 'PAT025', doc: 'DOC010', dt: d(8, 9, 30),    status: 'SCHEDULED',   notes: 'ESA initiation discussion — CKD anaemia management.' },
    { id: aptId(), pat: 'PAT019', doc: 'DOC004', dt: d(9, 15, 0),    status: 'SCHEDULED',   notes: 'EEG report review. Decision re: AED initiation.' },
    { id: aptId(), pat: 'PAT023', doc: 'DOC013', dt: d(10, 10, 30),  status: 'SCHEDULED',   notes: 'PSA result review. Shared decision-making re: active surveillance.' },
    { id: aptId(), pat: 'PAT004', doc: 'DOC009', dt: d(11, 11, 0),   status: 'SCHEDULED',   notes: 'RA — general health screen and vaccine review.' },
    { id: aptId(), pat: 'PAT016', doc: 'DOC008', dt: d(12, 10, 0),   status: 'SCHEDULED',   notes: 'Paediatric cardiology referral — exercise-induced palpitations.' },
    { id: aptId(), pat: 'PAT014', doc: 'DOC010', dt: d(14, 11, 30),  status: 'SCHEDULED',   notes: 'Geriatric diet and lifestyle review for pre-diabetes management.' },
    { id: aptId(), pat: 'PAT018', doc: 'DOC005', dt: d(18, 8, 0),    status: 'SCHEDULED',   notes: 'Right total knee replacement — scheduled surgery.' },
    { id: aptId(), pat: 'PAT022', doc: 'DOC011', dt: d(21, 14, 0),   status: 'SCHEDULED',   notes: 'SLE cutaneous review — photosensitivity and rash mapping.' },
    { id: aptId(), pat: 'PAT020', doc: 'DOC014', dt: d(28, 10, 0),   status: 'SCHEDULED',   notes: 'Ovarian cancer long-term review — potential radiotherapy discussion.' },
  ];

  for (const a of appointmentData) {
    await prisma.appointment.upsert({
      where: { appointmentId: a.id },
      update: {},
      create: {
        appointmentId: a.id,
        patientId: patients[a.pat].id,
        doctorId:  doctors[a.doc].id,
        dateTime:  a.dt,
        status:    a.status,
        notes:     a.notes,
      },
    });
  }

  console.log('Seeding audit logs...');

  const adminUser = await prisma.user.findUnique({ where: { username: adminUsername } });

  const auditEntries = [
    { action: 'CREATE', entity: 'Patient',     entityId: patients['PAT001'].id.toString(), details: { name: 'Thomas Anderson' } },
    { action: 'CREATE', entity: 'Doctor',      entityId: doctors['DOC001'].id.toString(),  details: { name: 'Dr. James Harrington' } },
    { action: 'UPDATE', entity: 'Patient',     entityId: patients['PAT010'].id.toString(), details: { field: 'medicalHistory', change: 'cancer staging updated' } },
    { action: 'CREATE', entity: 'Appointment', entityId: '1',                              details: { patientId: patients['PAT001'].id, doctorId: doctors['DOC001'].id } },
    { action: 'UPDATE', entity: 'Appointment', entityId: '1',                              details: { status: 'COMPLETED' } },
    { action: 'CREATE', entity: 'Department',  entityId: depts['Oncology'].id.toString(),  details: { name: 'Oncology' } },
    { action: 'UPDATE', entity: 'Settings',    entityId: null,                             details: { key: 'hospital_name', value: 'City General Hospital' } },
    { action: 'CREATE', entity: 'User',        entityId: adminUser.id.toString(),          details: { username: adminUsername, role: 'ADMIN' } },
  ];

  for (const entry of auditEntries) {
    await prisma.auditLog.create({
      data: { userId: adminUser.id, ...entry },
    });
  }

  console.log('\n✅ Seed completed successfully.');
  console.log(`   Departments : ${deptData.length}`);
  console.log(`   Doctors     : ${doctorData.length}`);
  console.log(`   Patients    : ${patientData.length}`);
  console.log(`   Visits      : ${visitData.length}`);
  console.log(`   Appointments: ${appointmentData.length}`);
  console.log(`   Audit logs  : ${auditEntries.length}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
