
'use client';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export type ActivityType = 
  | 'new_application' 
  | 'student_admitted'
  | 'student_added'
  | 'gallery_upload' 
  | 'note_published' 
  | 'notice_published' 
  | 'new_enquiry' 
  | 'new_message';

export interface ActivityPayload {
  description: string;
  link?: string;
  [key: string]: any;
}

export const logActivity = async (type: ActivityType, payload: ActivityPayload) => {
  if (!db) return;
  try {
    await addDoc(collection(db, 'activity_log'), {
      type,
      payload,
      timestamp: serverTimestamp(),
    });
  } catch (error) {
    console.error("Failed to log activity:", error);
    // Non-blocking, so we don't show an error to the user if logging fails.
  }
};
