/**
 * RPI seed.
 *
 * Idempotent: every record is created with `upsert` keyed by a stable
 * natural key (email/slug/composite), so running this script multiple times
 * converges to the same state.
 *
 * Run:    npx tsx prisma/seed.ts
 *   or    npx prisma db seed   (after registering in package.json)
 */

import {
  PrismaClient,
  GlobalRole,
  TenantStatus,
  TenantRole,
  PlanTier,
  JobStatus,
  EmploymentType,
  ExperienceLevel,
  LocationType,
  ApplicationStatus,
  CourseLevel,
  CourseStatus,
  LessonContentType,
  EnrollmentStatus,
  NotificationType,
  AuditAction,
} from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

const DEFAULT_PASSWORD = "Passw0rd!";
const SUPERADMIN_PASSWORD = "SuperAdmin123!";

async function hash(pw: string) {
  return bcrypt.hash(pw, 10);
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

function pick<T>(arr: T[], i: number): T {
  return arr[i % arr.length]!;
}

// -----------------------------------------------------------------------------
// Static data
// -----------------------------------------------------------------------------

const CATEGORIES: { name: string; slug: string; icon: string }[] = [
  { name: "IT & Software",  slug: "it-software",  icon: "Code" },
  { name: "Marketing",      slug: "marketing",    icon: "Megaphone" },
  { name: "Finance",        slug: "finance",      icon: "Banknote" },
  { name: "Human Resources", slug: "hr",          icon: "Users" },
  { name: "Engineering",    slug: "engineering",  icon: "Wrench" },
  { name: "Healthcare",     slug: "healthcare",   icon: "HeartPulse" },
  { name: "Education",      slug: "education",    icon: "GraduationCap" },
  { name: "Food & Beverage", slug: "f-and-b",     icon: "Utensils" },
  { name: "Logistics",      slug: "logistics",    icon: "Truck" },
  { name: "Construction",   slug: "construction", icon: "HardHat" },
  { name: "Design",         slug: "design",       icon: "Palette" },
  { name: "Sales",          slug: "sales",        icon: "TrendingUp" },
];

const JOBSEEKERS: { email: string; name: string; headline: string; location: string }[] = [
  { email: "andi@example.com",    name: "Andi Wijaya",     headline: "Full-Stack Engineer",    location: "Jakarta" },
  { email: "budi@example.com",    name: "Budi Santoso",    headline: "Data Analyst",            location: "Bandung" },
  { email: "citra@example.com",   name: "Citra Lestari",   headline: "Product Designer",        location: "Jakarta" },
  { email: "dewi@example.com",    name: "Dewi Anggraini",  headline: "Digital Marketer",        location: "Surabaya" },
  { email: "eko@example.com",     name: "Eko Pratama",     headline: "DevOps Engineer",         location: "Yogyakarta" },
  { email: "fitri@example.com",   name: "Fitri Handayani", headline: "HR Generalist",           location: "Jakarta" },
  { email: "gilang@example.com",  name: "Gilang Ramadhan", headline: "Mobile Developer",        location: "Bandung" },
  { email: "hana@example.com",    name: "Hana Putri",      headline: "Finance Associate",       location: "Medan" },
  { email: "indra@example.com",   name: "Indra Kusuma",    headline: "Sales Executive",         location: "Semarang" },
  { email: "joko@example.com",    name: "Joko Susilo",     headline: "QA Engineer",             location: "Malang" },
];

type JobSeed = {
  title: string
  cat: string
  type: EmploymentType
  level: ExperienceLevel
  locType: LocationType
  location: string
  min: number
  max: number
}
type CourseSeed = { title: string; level: CourseLevel; duration: number }

const RPI_JOBS: JobSeed[] = [
  { title: "Senior Backend Engineer",   cat: "it-software",  type: EmploymentType.FULL_TIME, level: ExperienceLevel.SENIOR, locType: LocationType.HYBRID, location: "Jakarta",   min: 25_000_000, max: 40_000_000 },
  { title: "Frontend Engineer (React)", cat: "it-software",  type: EmploymentType.FULL_TIME, level: ExperienceLevel.MID,    locType: LocationType.REMOTE, location: "Remote",    min: 18_000_000, max: 28_000_000 },
  { title: "Product Designer",          cat: "design",       type: EmploymentType.FULL_TIME, level: ExperienceLevel.MID,    locType: LocationType.HYBRID, location: "Jakarta",   min: 15_000_000, max: 25_000_000 },
  { title: "Digital Marketing Lead",    cat: "marketing",    type: EmploymentType.FULL_TIME, level: ExperienceLevel.LEAD,   locType: LocationType.ONSITE, location: "Jakarta",   min: 20_000_000, max: 35_000_000 },
  { title: "Finance Analyst",           cat: "finance",      type: EmploymentType.FULL_TIME, level: ExperienceLevel.JUNIOR, locType: LocationType.ONSITE, location: "Jakarta",   min: 9_000_000,  max: 15_000_000 },
  { title: "HR Business Partner",       cat: "hr",           type: EmploymentType.FULL_TIME, level: ExperienceLevel.SENIOR, locType: LocationType.HYBRID, location: "Jakarta",   min: 18_000_000, max: 28_000_000 },
  { title: "Mechanical Engineer",       cat: "engineering",  type: EmploymentType.FULL_TIME, level: ExperienceLevel.MID,    locType: LocationType.ONSITE, location: "Cikarang",  min: 12_000_000, max: 20_000_000 },
  { title: "Registered Nurse",          cat: "healthcare",   type: EmploymentType.FULL_TIME, level: ExperienceLevel.MID,    locType: LocationType.ONSITE, location: "Jakarta",   min: 8_000_000,  max: 12_000_000 },
  { title: "High School Teacher",       cat: "education",    type: EmploymentType.FULL_TIME, level: ExperienceLevel.MID,    locType: LocationType.ONSITE, location: "Bandung",   min: 7_000_000,  max: 11_000_000 },
  { title: "Restaurant Manager",        cat: "f-and-b",      type: EmploymentType.FULL_TIME, level: ExperienceLevel.SENIOR, locType: LocationType.ONSITE, location: "Surabaya",  min: 10_000_000, max: 16_000_000 },
  { title: "Logistics Coordinator",     cat: "logistics",    type: EmploymentType.FULL_TIME, level: ExperienceLevel.MID,    locType: LocationType.ONSITE, location: "Tangerang", min: 8_000_000,  max: 13_000_000 },
  { title: "Site Civil Engineer",       cat: "construction", type: EmploymentType.CONTRACT,  level: ExperienceLevel.MID,    locType: LocationType.ONSITE, location: "Bekasi",    min: 10_000_000, max: 16_000_000 },
  { title: "UI/UX Designer Intern",     cat: "design",       type: EmploymentType.INTERNSHIP,level: ExperienceLevel.ENTRY,  locType: LocationType.HYBRID, location: "Jakarta",   min: 3_500_000,  max: 5_000_000 },
  { title: "Sales Executive",           cat: "sales",        type: EmploymentType.FULL_TIME, level: ExperienceLevel.JUNIOR, locType: LocationType.ONSITE, location: "Jakarta",   min: 7_000_000,  max: 11_000_000 },
  { title: "Data Scientist",            cat: "it-software",  type: EmploymentType.FULL_TIME, level: ExperienceLevel.SENIOR, locType: LocationType.REMOTE, location: "Remote",    min: 25_000_000, max: 40_000_000 },
];

const TELKOM_JOBS: JobSeed[] = [
  { title: "Network Engineer",            cat: "it-software", type: EmploymentType.FULL_TIME, level: ExperienceLevel.MID,      locType: LocationType.ONSITE, location: "Bandung",  min: 14_000_000, max: 22_000_000 },
  { title: "Senior Cloud Architect",      cat: "it-software", type: EmploymentType.FULL_TIME, level: ExperienceLevel.SENIOR,   locType: LocationType.HYBRID, location: "Jakarta",  min: 35_000_000, max: 55_000_000 },
  { title: "Cybersecurity Specialist",    cat: "it-software", type: EmploymentType.FULL_TIME, level: ExperienceLevel.SENIOR,   locType: LocationType.ONSITE, location: "Jakarta",  min: 28_000_000, max: 45_000_000 },
  { title: "Customer Care Representative", cat: "sales",      type: EmploymentType.FULL_TIME, level: ExperienceLevel.ENTRY,    locType: LocationType.ONSITE, location: "Bandung",  min: 5_500_000,  max: 8_000_000 },
  { title: "RF Optimization Engineer",    cat: "engineering", type: EmploymentType.FULL_TIME, level: ExperienceLevel.MID,      locType: LocationType.ONSITE, location: "Surabaya", min: 13_000_000, max: 19_000_000 },
  { title: "Product Marketing Manager",   cat: "marketing",   type: EmploymentType.FULL_TIME, level: ExperienceLevel.LEAD,     locType: LocationType.HYBRID, location: "Jakarta",  min: 25_000_000, max: 38_000_000 },
  { title: "Data Engineer",               cat: "it-software", type: EmploymentType.FULL_TIME, level: ExperienceLevel.MID,      locType: LocationType.REMOTE, location: "Remote",   min: 20_000_000, max: 32_000_000 },
  { title: "Field Technician",            cat: "engineering", type: EmploymentType.CONTRACT,  level: ExperienceLevel.JUNIOR,   locType: LocationType.ONSITE, location: "Bali",     min: 6_000_000,  max: 9_000_000 },
  { title: "DevOps SRE",                  cat: "it-software", type: EmploymentType.FULL_TIME, level: ExperienceLevel.SENIOR,   locType: LocationType.HYBRID, location: "Jakarta",  min: 30_000_000, max: 48_000_000 },
  { title: "Treasury Analyst",            cat: "finance",     type: EmploymentType.FULL_TIME, level: ExperienceLevel.MID,      locType: LocationType.ONSITE, location: "Jakarta",  min: 12_000_000, max: 18_000_000 },
  { title: "Training Specialist",         cat: "education",   type: EmploymentType.FULL_TIME, level: ExperienceLevel.MID,      locType: LocationType.ONSITE, location: "Bandung",  min: 10_000_000, max: 15_000_000 },
  { title: "Procurement Officer",         cat: "logistics",   type: EmploymentType.FULL_TIME, level: ExperienceLevel.MID,      locType: LocationType.ONSITE, location: "Jakarta",  min: 11_000_000, max: 17_000_000 },
  { title: "Internal Auditor",            cat: "finance",     type: EmploymentType.FULL_TIME, level: ExperienceLevel.SENIOR,   locType: LocationType.ONSITE, location: "Jakarta",  min: 18_000_000, max: 28_000_000 },
  { title: "Brand Designer",              cat: "design",      type: EmploymentType.FULL_TIME, level: ExperienceLevel.MID,      locType: LocationType.HYBRID, location: "Jakarta",  min: 13_000_000, max: 20_000_000 },
  { title: "Talent Acquisition Partner",  cat: "hr",          type: EmploymentType.FULL_TIME, level: ExperienceLevel.MID,      locType: LocationType.HYBRID, location: "Jakarta",  min: 12_000_000, max: 18_000_000 },
];

const RPI_COURSES: CourseSeed[] = [
  { title: "Fundamentals of JavaScript",   level: CourseLevel.BEGINNER,    duration: 12 },
  { title: "Mastering React for Production", level: CourseLevel.INTERMEDIATE, duration: 24 },
  { title: "SQL and Postgres Deep Dive",   level: CourseLevel.INTERMEDIATE, duration: 18 },
  { title: "Resume & Interview Bootcamp",  level: CourseLevel.BEGINNER,    duration: 6 },
];

const TELKOM_COURSES: CourseSeed[] = [
  { title: "5G Network Fundamentals",      level: CourseLevel.INTERMEDIATE, duration: 20 },
  { title: "Cloud Native Architecture",    level: CourseLevel.ADVANCED,    duration: 30 },
  { title: "Cybersecurity Essentials",     level: CourseLevel.BEGINNER,    duration: 14 },
  { title: "Telco Customer Excellence",    level: CourseLevel.BEGINNER,    duration: 8 },
];

// -----------------------------------------------------------------------------
// Seed steps
// -----------------------------------------------------------------------------

async function seedCategories() {
  console.log("Seeding job categories...");
  for (const c of CATEGORIES) {
    await prisma.jobCategory.upsert({
      where: { slug: c.slug },
      update: { name: c.name, icon: c.icon },
      create: { name: c.name, slug: c.slug, icon: c.icon },
    });
  }
  console.log(`  ${CATEGORIES.length} categories.`);
}

async function seedSuperadmin() {
  console.log("Seeding superadmin...");
  const pwHash = await hash(SUPERADMIN_PASSWORD);
  const user = await prisma.user.upsert({
    where: { email: "super@rumahpekerja.id" },
    update: {},
    create: {
      email: "super@rumahpekerja.id",
      name: "RPI Superadmin",
      passwordHash: pwHash,
      globalRole: GlobalRole.SUPERADMIN,
      headline: "Platform Administrator",
      emailVerified: new Date(),
    },
  });
  console.log(`  superadmin: ${user.email}`);
  return user;
}

async function seedTenants() {
  console.log("Seeding tenants + branding...");

  const rpi = await prisma.tenant.upsert({
    where: { slug: "main" },
    update: { name: "Rumah Pekerja Indonesia", planTier: PlanTier.ENTERPRISE, status: TenantStatus.ACTIVE },
    create: {
      slug: "main",
      name: "Rumah Pekerja Indonesia",
      planTier: PlanTier.ENTERPRISE,
      status: TenantStatus.ACTIVE,
    },
  });
  await prisma.branding.upsert({
    where: { tenantId: rpi.id },
    update: {},
    create: { tenantId: rpi.id }, // defaults: navy + gold
  });

  const telkom = await prisma.tenant.upsert({
    where: { slug: "telkom" },
    update: { name: "Telkom Indonesia Careers", planTier: PlanTier.BUSINESS, status: TenantStatus.ACTIVE },
    create: {
      slug: "telkom",
      name: "Telkom Indonesia Careers",
      planTier: PlanTier.BUSINESS,
      status: TenantStatus.ACTIVE,
    },
  });
  await prisma.branding.upsert({
    where: { tenantId: telkom.id },
    update: {
      primaryColor: "#E60000",
      primaryForeground: "#FFFFFF",
      secondaryColor: "#FFD700",
      secondaryForeground: "#0A2540",
      ringColor: "#E60000",
    },
    create: {
      tenantId: telkom.id,
      primaryColor: "#E60000",
      primaryForeground: "#FFFFFF",
      secondaryColor: "#FFD700",
      secondaryForeground: "#0A2540",
      ringColor: "#E60000",
    },
  });

  console.log(`  rpi(${rpi.slug}) + telkom(${telkom.slug})`);
  return { rpi, telkom };
}

async function seedTenantPeople(tenantId: string, slug: string) {
  // partner owner + 2 recruiters
  const ownerEmail = `partner@${slug}.id`;
  const owner = await prisma.user.upsert({
    where: { email: ownerEmail },
    update: {},
    create: {
      email: ownerEmail,
      name: `${slug.toUpperCase()} Partner`,
      passwordHash: await hash(DEFAULT_PASSWORD),
      globalRole: GlobalRole.PARTNER,
      headline: "Tenant Owner",
      emailVerified: new Date(),
    },
  });
  await prisma.userTenant.upsert({
    where: { userId_tenantId: { userId: owner.id, tenantId } },
    update: { role: TenantRole.OWNER },
    create: { userId: owner.id, tenantId, role: TenantRole.OWNER },
  });
  await prisma.tenant.update({ where: { id: tenantId }, data: { ownerUserId: owner.id } });

  const recruiters = [];
  for (let i = 1; i <= 2; i++) {
    const email = `recruiter${i}@${slug}.id`;
    const u = await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        email,
        name: `${slug.toUpperCase()} Recruiter ${i}`,
        passwordHash: await hash(DEFAULT_PASSWORD),
        globalRole: GlobalRole.USER,
        headline: "Recruiter",
        emailVerified: new Date(),
      },
    });
    await prisma.userTenant.upsert({
      where: { userId_tenantId: { userId: u.id, tenantId } },
      update: { role: TenantRole.RECRUITER },
      create: { userId: u.id, tenantId, role: TenantRole.RECRUITER },
    });
    await prisma.teamMember.upsert({
      where: { tenantId_memberId: { tenantId, memberId: u.id } },
      update: { leadId: owner.id, role: TenantRole.RECRUITER },
      create: { tenantId, leadId: owner.id, memberId: u.id, role: TenantRole.RECRUITER },
    });
    recruiters.push(u);
  }
  return { owner, recruiters };
}

async function seedJobseekers() {
  console.log("Seeding jobseekers...");
  const users = [];
  for (const j of JOBSEEKERS) {
    const u = await prisma.user.upsert({
      where: { email: j.email },
      update: { headline: j.headline, location: j.location },
      create: {
        email: j.email,
        name: j.name,
        headline: j.headline,
        location: j.location,
        passwordHash: await hash(DEFAULT_PASSWORD),
        globalRole: GlobalRole.USER,
        emailVerified: new Date(),
      },
    });
    users.push(u);
  }
  console.log(`  ${users.length} jobseekers.`);
  return users;
}

async function seedJobs(
  tenantId: string,
  slug: string,
  posterId: string,
  defs: typeof RPI_JOBS,
) {
  const categories = await prisma.jobCategory.findMany();
  const catBySlug = new Map(categories.map((c) => [c.slug, c.id]));
  const statuses: JobStatus[] = [JobStatus.PUBLISHED, JobStatus.PUBLISHED, JobStatus.PUBLISHED, JobStatus.DRAFT, JobStatus.PAUSED];
  const created = [];
  let i = 0;
  for (const def of defs) {
    const jobSlug = `${slugify(def.title)}-${i + 1}`;
    const status = pick(statuses, i);
    const job = await prisma.job.upsert({
      where: { tenantId_slug: { tenantId, slug: jobSlug } },
      update: {},
      create: {
        tenantId,
        title: def.title,
        slug: jobSlug,
        description: `${def.title} role at ${slug.toUpperCase()}. Join a high-performing team driving impact across Indonesia.`,
        responsibilities: "- Deliver against quarterly objectives\n- Collaborate cross-functionally\n- Mentor juniors",
        requirements: "- Relevant degree or equivalent\n- 2+ years professional experience\n- Strong communication skills",
        benefits: "- Competitive salary\n- BPJS + private health insurance\n- Learning budget\n- Flexible work",
        salaryMin: def.min,
        salaryMax: def.max,
        employmentType: def.type,
        experienceLevel: def.level,
        location: def.location,
        locationType: def.locType,
        categoryId: catBySlug.get(def.cat) ?? null,
        tags: [def.cat, def.type.toLowerCase(), def.level.toLowerCase()],
        status,
        postedById: posterId,
        publishedAt: status === JobStatus.PUBLISHED ? daysAgo(i + 1) : null,
        expiredAt: status === JobStatus.PUBLISHED ? daysAgo(-30 + i) : null,
        views: Math.floor(Math.random() * 500),
      },
    });
    created.push(job);
    i++;
  }
  return created;
}

async function seedCourses(
  tenantId: string,
  instructorId: string,
  defs: typeof RPI_COURSES,
) {
  const created = [];
  let i = 0;
  for (const def of defs) {
    const cSlug = slugify(def.title);
    const course = await prisma.course.upsert({
      where: { tenantId_slug: { tenantId, slug: cSlug } },
      update: {},
      create: {
        tenantId,
        title: def.title,
        slug: cSlug,
        description: `${def.title} - hands-on, project-based curriculum.`,
        level: def.level,
        durationHours: def.duration,
        instructorId,
        status: i === 0 ? CourseStatus.DRAFT : CourseStatus.PUBLISHED,
        publishedAt: i === 0 ? null : daysAgo(10 + i),
      },
    });

    // 3 modules x 4 lessons
    for (let m = 1; m <= 3; m++) {
      const existingModules = await prisma.module.findMany({ where: { courseId: course.id, order: m } });
      let mod = existingModules[0];
      if (!mod) {
        mod = await prisma.module.create({
          data: {
            courseId: course.id,
            title: `Module ${m}: ${def.title} Part ${m}`,
            order: m,
            durationMin: 60 * 2,
          },
        });
      }
      for (let l = 1; l <= 4; l++) {
        const exists = await prisma.lesson.findFirst({ where: { moduleId: mod.id, order: l } });
        if (exists) continue;
        const types: LessonContentType[] = [
          LessonContentType.VIDEO,
          LessonContentType.ARTICLE,
          LessonContentType.QUIZ,
          LessonContentType.ASSIGNMENT,
        ];
        await prisma.lesson.create({
          data: {
            moduleId: mod.id,
            title: `Lesson ${m}.${l}`,
            contentType: types[(l - 1) % types.length]!,
            contentUrl: "https://example.com/lesson.mp4",
            contentBody: "Lesson body content (markdown).",
            order: l,
            durationMin: 15,
          },
        });
      }
    }

    created.push(course);
    i++;
  }
  return created;
}

async function seedApplications(jobseekers: any[], publishedJobs: any[]) {
  console.log("Seeding applications...");
  const targetCount = Math.min(15, jobseekers.length * publishedJobs.length);
  const statuses = [
    ApplicationStatus.APPLIED,
    ApplicationStatus.REVIEWED,
    ApplicationStatus.SHORTLISTED,
    ApplicationStatus.INTERVIEW,
    ApplicationStatus.REJECTED,
  ];
  let made = 0;
  for (let i = 0; i < targetCount && made < 15; i++) {
    const user = jobseekers[i % jobseekers.length];
    const job = publishedJobs[i % publishedJobs.length];
    if (!job) break;
    try {
      await prisma.application.upsert({
        where: { jobId_userId: { jobId: job.id, userId: user.id } },
        update: {},
        create: {
          tenantId: job.tenantId,
          jobId: job.id,
          userId: user.id,
          status: pick(statuses, i),
          coverLetter: `Dear hiring team, I am excited to apply for the ${job.title} role...`,
          resumeUrl: "https://example.com/resume.pdf",
          appliedAt: daysAgo(i + 1),
        },
      });
      made++;
    } catch {
      // unique conflict - skip
    }
  }
  console.log(`  ${made} applications.`);
}

async function seedSavedJobs(jobseekers: any[], publishedJobs: any[]) {
  console.log("Seeding saved jobs...");
  let made = 0;
  for (let i = 0; i < 8; i++) {
    const user = jobseekers[(i + 2) % jobseekers.length];
    const job = publishedJobs[(i * 3) % publishedJobs.length];
    if (!job) continue;
    try {
      await prisma.savedJob.upsert({
        where: { userId_jobId: { userId: user.id, jobId: job.id } },
        update: {},
        create: { userId: user.id, jobId: job.id },
      });
      made++;
    } catch {}
  }
  console.log(`  ${made} saved jobs.`);
}

async function seedEnrollments(jobseekers: any[], courses: any[]) {
  console.log("Seeding enrollments...");
  let made = 0;
  for (let i = 0; i < 6 && i < jobseekers.length; i++) {
    const user = jobseekers[i];
    const course = courses[i % courses.length];
    if (!course) continue;
    const progress = (i + 1) * 15;
    const status = progress >= 100 ? EnrollmentStatus.COMPLETED : EnrollmentStatus.IN_PROGRESS;
    try {
      await prisma.enrollment.upsert({
        where: { userId_courseId: { userId: user.id, courseId: course.id } },
        update: { progress, status },
        create: {
          userId: user.id,
          courseId: course.id,
          progress,
          status,
          enrolledAt: daysAgo(20 - i),
          completedAt: status === EnrollmentStatus.COMPLETED ? daysAgo(1) : null,
        },
      });
      made++;
    } catch {}
  }
  console.log(`  ${made} enrollments.`);
}

async function seedCertificates(jobseekers: any[], courses: any[]) {
  console.log("Seeding certificates...");
  let made = 0;
  for (let i = 0; i < 3; i++) {
    const user = jobseekers[i];
    const course = courses[i];
    if (!user || !course) continue;
    const exists = await prisma.certificate.findFirst({
      where: { userId: user.id, courseId: course.id },
    });
    if (exists) { made++; continue; }
    await prisma.certificate.create({
      data: {
        userId: user.id,
        courseId: course.id,
        title: `Certificate of Completion - ${course.title}`,
        fileUrl: `https://example.com/cert/${user.id}-${course.id}.pdf`,
        issuer: "Rumah Pekerja Indonesia",
      },
    });
    made++;
  }
  console.log(`  ${made} certificates.`);
}

async function seedAuditLogs(actors: any[], tenants: any[]) {
  console.log("Seeding audit logs...");
  const actions = [
    AuditAction.LOGIN,
    AuditAction.CREATE,
    AuditAction.UPDATE,
    AuditAction.INVITE,
    AuditAction.PERMISSION_CHANGE,
  ];
  const resources = ["job", "user", "tenant", "application", "course"];
  let made = 0;
  for (let i = 0; i < 20; i++) {
    const actor = actors[i % actors.length];
    const tenant = tenants[i % tenants.length];
    await prisma.auditLog.create({
      data: {
        tenantId: i % 5 === 0 ? null : tenant.id,
        userId: actor.id,
        action: pick(actions, i),
        resource: pick(resources, i),
        resourceId: `res_${i}`,
        metadata: { seq: i, note: "seed entry" },
        ip: "127.0.0.1",
        userAgent: "seed-script",
        createdAt: daysAgo(20 - i),
      },
    });
    made++;
  }
  console.log(`  ${made} audit logs.`);
}

async function seedSubscriptions(rpi: any, telkom: any) {
  console.log("Seeding subscriptions...");
  const now = new Date();
  const periodEnd = new Date(now);
  periodEnd.setMonth(periodEnd.getMonth() + 1);

  const existsRpi = await prisma.subscription.findFirst({ where: { tenantId: rpi.id } });
  if (!existsRpi) {
    await prisma.subscription.create({
      data: {
        tenantId: rpi.id,
        plan: PlanTier.ENTERPRISE,
        status: "active",
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        stripeSubscriptionId: "sub_seed_rpi",
      },
    });
  }
  const existsTelkom = await prisma.subscription.findFirst({ where: { tenantId: telkom.id } });
  if (!existsTelkom) {
    await prisma.subscription.create({
      data: {
        tenantId: telkom.id,
        plan: PlanTier.BUSINESS,
        status: "active",
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        stripeSubscriptionId: "sub_seed_telkom",
      },
    });
  }
  console.log("  2 subscriptions.");
}

async function seedNotifications(jobseekers: any[]) {
  console.log("Seeding notifications...");
  for (let i = 0; i < jobseekers.length; i++) {
    const u = jobseekers[i];
    const exists = await prisma.notification.findFirst({ where: { userId: u.id } });
    if (exists) continue;
    await prisma.notification.create({
      data: {
        userId: u.id,
        type: NotificationType.JOB_RECOMMEND,
        title: "Lowongan baru sesuai profilmu",
        body: "Kami menemukan beberapa lowongan baru yang cocok untukmu.",
        link: "/jobs",
      },
    });
  }
}

// -----------------------------------------------------------------------------
// Main
// -----------------------------------------------------------------------------

async function main() {
  console.log("=== RPI Seed ===");

  await seedCategories();
  const superadmin = await seedSuperadmin();
  const { rpi, telkom } = await seedTenants();

  const rpiPeople    = await seedTenantPeople(rpi.id,    "rpi");
  const telkomPeople = await seedTenantPeople(telkom.id, "telkom");

  const jobseekers = await seedJobseekers();

  console.log("Seeding jobs...");
  const rpiJobs    = await seedJobs(rpi.id,    "rpi",    rpiPeople.owner.id,    RPI_JOBS);
  const telkomJobs = await seedJobs(telkom.id, "telkom", telkomPeople.owner.id, TELKOM_JOBS);
  console.log(`  ${rpiJobs.length} RPI + ${telkomJobs.length} Telkom jobs.`);

  console.log("Seeding courses (3 modules x 4 lessons each)...");
  const rpiCourses    = await seedCourses(rpi.id,    rpiPeople.owner.id,    RPI_COURSES);
  const telkomCourses = await seedCourses(telkom.id, telkomPeople.owner.id, TELKOM_COURSES);
  console.log(`  ${rpiCourses.length} RPI + ${telkomCourses.length} Telkom courses.`);

  const publishedJobs = [...rpiJobs, ...telkomJobs].filter((j) => j.status === JobStatus.PUBLISHED);
  const allCourses    = [...rpiCourses, ...telkomCourses];

  await seedApplications(jobseekers, publishedJobs);
  await seedSavedJobs(jobseekers, publishedJobs);
  await seedEnrollments(jobseekers, allCourses);
  await seedCertificates(jobseekers, allCourses);
  await seedNotifications(jobseekers);

  await seedAuditLogs(
    [superadmin, rpiPeople.owner, telkomPeople.owner, ...jobseekers.slice(0, 3)],
    [rpi, telkom],
  );

  await seedSubscriptions(rpi, telkom);

  console.log("=== Seed complete ===");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
