import React, { createContext, useContext, useEffect, useState } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { DEFAULT_CATEGORIES, DEFAULT_EDUCATION_LEVELS, DEFAULT_RESOURCE_TYPES, SiteSettings } from '../types';

interface SettingsContextType {
  settings: SiteSettings;
  loading: boolean;
  updateSettings: (newSettings: Partial<SiteSettings>, updatedByUid: string) => Promise<void>;
  addCategory: (categoryName: string, updatedByUid: string) => Promise<void>;
  removeCategory: (categoryName: string, updatedByUid: string) => Promise<void>;
}

const defaultSettings: SiteSettings = {
  siteTitle: 'คลังปัญญา (KlangPanya)',
  siteDescription: 'ศูนย์รวมและแบ่งปันสื่อการเรียนรู้ แหล่งค้นคว้า ใบงาน วิดีโอ และบทความทางการศึกษา เพื่อสังคมแห่งการเรียนรู้ที่เท่าเทียม',
  announcement: 'ยินดีต้อนรับสู่คลังปัญญา! ร่วมแบ่งปันใบงาน บทเรียน และสื่อการเรียนรู้ที่เป็นประโยชน์แก่เพื่อนนักเรียนและครูได้แล้ววันนี้',
  isAnnouncementActive: true,
  categories: DEFAULT_CATEGORIES,
  educationLevels: DEFAULT_EDUCATION_LEVELS,
  resourceTypes: DEFAULT_RESOURCE_TYPES,
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<SiteSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const docRef = doc(db, 'settings', 'general');
    const path = 'settings/general';

    const unsubscribe = onSnapshot(
      docRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data() as Partial<SiteSettings>;
          setSettings({
            siteTitle: data.siteTitle || defaultSettings.siteTitle,
            siteDescription: data.siteDescription || defaultSettings.siteDescription,
            announcement: data.announcement || defaultSettings.announcement,
            isAnnouncementActive: data.isAnnouncementActive ?? defaultSettings.isAnnouncementActive,
            categories: data.categories && data.categories.length > 0 ? data.categories : defaultSettings.categories,
            educationLevels: data.educationLevels && data.educationLevels.length > 0 ? data.educationLevels : defaultSettings.educationLevels,
            resourceTypes: data.resourceTypes && data.resourceTypes.length > 0 ? data.resourceTypes : defaultSettings.resourceTypes,
            updatedAt: data.updatedAt,
            updatedBy: data.updatedBy,
          });
        } else {
          // Initialize default document
          setDoc(docRef, {
            ...defaultSettings,
            updatedAt: new Date().toISOString(),
          }).catch((err) => {
            console.warn('Initial settings write notice (will apply default):', err);
          });
        }
        setLoading(false);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, path);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const updateSettings = async (newSettings: Partial<SiteSettings>, updatedByUid: string) => {
    const docRef = doc(db, 'settings', 'general');
    const path = 'settings/general';
    try {
      const merged = {
        ...settings,
        ...newSettings,
        updatedAt: new Date().toISOString(),
        updatedBy: updatedByUid,
      };
      await setDoc(docRef, merged, { merge: true });
      setSettings(merged);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  };

  const addCategory = async (categoryName: string, updatedByUid: string) => {
    const trimmed = categoryName.trim();
    if (!trimmed || settings.categories.includes(trimmed)) return;
    const updatedCategories = [...settings.categories, trimmed];
    await updateSettings({ categories: updatedCategories }, updatedByUid);
  };

  const removeCategory = async (categoryName: string, updatedByUid: string) => {
    const updatedCategories = settings.categories.filter((c) => c !== categoryName);
    await updateSettings({ categories: updatedCategories }, updatedByUid);
  };

  return (
    <SettingsContext.Provider
      value={{
        settings,
        loading,
        updateSettings,
        addCategory,
        removeCategory,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
