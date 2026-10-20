export type UserRole = 'guest' | 'member' | 'moderator' | 'admin';
export type AccountStatus = 'active' | 'suspended';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: UserRole;
  status: AccountStatus;
  bio?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type ResourceStatus = 'published' | 'hidden';

export interface ResourceItem {
  id: string;
  title: string;
  description: string;
  category: string;
  educationLevel: string;
  resourceType: string;
  url: string;
  fileUrl?: string;
  thumbnailUrl?: string;
  authorId: string;
  authorName: string;
  authorEmail?: string;
  authorPhoto?: string;
  status: ResourceStatus;
  viewCount: number;
  favoriteCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface FavoriteItem {
  id: string; // userId_resourceId
  userId: string;
  resourceId: string;
  resourceTitle: string;
  resourceCategory?: string;
  resourceType?: string;
  createdAt: string;
}

export type ReportStatus = 'pending' | 'resolved' | 'dismissed';

export interface ReportItem {
  id: string;
  resourceId: string;
  resourceTitle: string;
  reportedByUid: string;
  reportedByEmail?: string;
  reason: string;
  details?: string;
  status: ReportStatus;
  createdAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
}

export interface ModerationLogItem {
  id: string;
  action: string;
  targetType: 'resource' | 'user' | 'settings';
  targetId: string;
  details: string;
  performedByUid: string;
  performedByEmail: string;
  timestamp: string;
}

export interface SiteSettings {
  siteTitle: string;
  siteDescription: string;
  announcement: string;
  isAnnouncementActive: boolean;
  categories: string[];
  educationLevels: string[];
  resourceTypes: string[];
  updatedAt?: string;
  updatedBy?: string;
}

export const DEFAULT_CATEGORIES = [
  'คอมพิวเตอร์และเทคโนโลยี',
  'คณิตศาสตร์',
  'วิทยาศาสตร์และดาราศาสตร์',
  'ภาษาไทย',
  'ภาษาอังกฤษและภาษาต่างประเทศ',
  'สังคมศึกษาและประวัติศาสตร์',
  'ศิลปะและการออกแบบ',
  'ดนตรีและการแสดง',
  'สุขศึกษาและพลศึกษา',
  'การงานอาชีพและธุรกิจ',
  'การพัฒนาตนเองและการสอบเข้า',
  'ทั่วไปและเบ็ดเตล็ด'
];

export const DEFAULT_EDUCATION_LEVELS = [
  'ทุกระดับชั้น',
  'ประถมศึกษา (ป.1 - ป.6)',
  'มัธยมศึกษาตอนต้น (ม.1 - ม.3)',
  'มัธยมศึกษาตอนปลาย (ม.4 - ม.6)',
  'อาชีวศึกษา (ปวช. / ปวส.)',
  'อุดมศึกษา (ปริญญาตรีขึ้นไป)',
  'ครูและบุคลากรทางการศึกษา',
  'บุคคลทั่วไป'
];

export const DEFAULT_RESOURCE_TYPES = [
  'เอกสาร / ใบงาน (PDF/Doc)',
  'วิดีโอ / บันทึกการสอน',
  'ลิงก์เว็บไซต์ / บทความออนไลน์',
  'สไลด์นำเสนอ (Slide/Presentation)',
  'คอร์สเรียน / คลังแบบฝึกหัด'
];
