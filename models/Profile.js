import mongoose from 'mongoose';

const ProfileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },

  // ── Section 1: أساسيات التعامل ──────────────────────────────────────────
  hasPermanentSign: { type: String, enum: ['نعم', 'لا', ''], default: '' },
  hasWaitingArea: { type: String, enum: ['نعم', 'لا', ''], default: '' },
  hasComputerInternet: { type: String, enum: ['نعم', 'لا', ''], default: '' },
  hasTrainedResearcher: { type: String, enum: ['نعم', 'لا', ''], default: '' },
  usesTechnology: { type: String, enum: ['نعم', 'لا', ''], default: '' },
  hasCertifiedFinancialRecords: { type: String, enum: ['نعم', 'لا', ''], default: '' },
  hasBalanceSheet: { type: String, enum: ['نعم', 'لا', ''], default: '' },

  // ── Section 2: البيانات الأولية للتسجيل ─────────────────────────────────
  organizationType: { type: String, default: '' },
  organizationName: { type: String, default: '' },
  registrationNumberYear: { type: String, default: '' },
  orgEmail: { type: String, default: '' },
  orgPhone: { type: String, default: '' },
  hasWebsite: { type: String, enum: ['نعم', 'لا', ''], default: '' },
  websiteUrl: { type: String, default: '' },
  hasSocialMedia: { type: String, enum: ['نعم', 'لا', ''], default: '' },
  socialMediaLinks: { type: String, default: '' },

  // ── Section 3: البيانات الخاصة بالموقع الجغرافي ─────────────────────────
  governorate: { type: String, default: '' },
  district: { type: String, default: '' },
  localUnit: { type: String, default: '' },
  village: { type: String, default: '' },
  street: { type: String, default: '' },
  latitude: { type: String, default: '' },
  longitude: { type: String, default: '' },
  locationLink: { type: String, default: '' },

  // ── Section 4: بيانات المقر ──────────────────────────────────────────────
  hqAddress: { type: String, default: '' },
  hqType: { type: String, default: '' },
  hqContractType: { type: String, default: '' },
  hqFinishingLevel: { type: String, default: '' },
  hqArea: { type: String, default: '' },
  hqFloor: { type: String, default: '' },
  hqRooms: { type: String, default: '' },
  hqDeepFreezers: { type: String, default: '' },
  hqFreezerCapacity: { type: String, default: '' },
  hasTrainingHalls: { type: String, enum: ['نعم', 'لا', ''], default: '' },
  hqHasComputer: { type: String, enum: ['نعم', 'لا', ''], default: '' },
  internetWorkers: { type: String, default: '' },
  researchersCount: { type: String, default: '' },
  officeFurniture: { type: String, default: '' },
  internalLayoutDesc: { type: String, default: '' },
  roomUsage: { type: String, default: '' },
  availableFacilities: { type: String, default: '' },
  allowsEvents: { type: String, enum: ['نعم', 'لا', ''], default: '' },
  hasBranch: { type: String, enum: ['نعم', 'لا', ''], default: '' },

  // ── Section 5: البيانات الخاصة بالمخزن ─────────────────────────────────
  hasStorage: { type: String, enum: ['نعم', 'لا', ''], default: '' },
  storageLocation: { type: String, default: '' },
  storageArea: { type: String, default: '' },
  storageEquipment: { type: String, default: '' },
  storageFloor: { type: String, default: '' },
  hasAdditionalStorage: { type: String, enum: ['نعم', 'لا', ''], default: '' },
  additionalStorageArea: { type: String, default: '' },
  hasCoolingRoom: { type: String, enum: ['نعم', 'لا', ''], default: '' },

  // ── Section 6: البيانات الخاصة بالمطبخ ─────────────────────────────────
  hasKitchen: { type: String, enum: ['نعم', 'لا', ''], default: '' },
  kitchenLocation: { type: String, default: '' },
  dailyMeals: { type: String, default: '' },
  kitchenArea: { type: String, default: '' },
  kitchenFloor: { type: String, default: '' },
  kitchenEquipment: { type: String, default: '' },

  // ── Section 7: البيانات الخاصة بقواعد البيانات ──────────────────────────
  hasDatabase: { type: String, enum: ['نعم', 'لا', ''], default: '' },
  researchType: { type: String, default: '' },
  familiesWithDatabases: { type: String, default: '' },
  appropriateSupport: { type: String, default: '' },
  monthlyFamilies: { type: String, default: '' },
  seasonalFamilies: { type: String, default: '' },

  // ── Section 8: الأنشطة القائمة بالجهة ───────────────────────────────────
  currentActivities: { type: String, default: '' },

  // ── Section 9: بيانات الباحث ─────────────────────────────────────────────
  researcherName: { type: String, default: '' },
  researcherPhone: { type: String, default: '' },
  researcherEmail: { type: String, default: '' },
  researcherQualification: { type: String, default: '' },

  // ── Section 10: أعضاء مجلس الإدارة ──────────────────────────────────────
  boardMembers: [
    {
      name: { type: String, default: '' },
      role: { type: String, default: '' },
      phone: { type: String, default: '' },
      nationalId: { type: String, default: '' },
    },
  ],

  // ── Section 11: بيانات الجهاز التنفيذي ──────────────────────────────────
  executiveStaff: [
    {
      name: { type: String, default: '' },
      role: { type: String, default: '' },
      phone: { type: String, default: '' },
      qualification: { type: String, default: '' },
    },
  ],

  // ── Section 12: الأوراق والمستندات المطلوبة ─────────────────────────────
  documents: [
    {
      name: { type: String, default: '' },
      fileUrl: { type: String, default: '' },
      uploadedAt: { type: Date },
    },
  ],

  // ── Meta ─────────────────────────────────────────────────────────────────
  isComplete: { type: Boolean, default: false },
  lastUpdatedBy: { type: String, enum: ['admin', 'user'], default: 'admin' },
}, { timestamps: true });

export default mongoose.models.Profile || mongoose.model('Profile', ProfileSchema);
