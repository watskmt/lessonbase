export type StudentStatus = "active" | "suspended" | "withdrawn";
export type AttendanceStatus = "present" | "absent" | "reschedule" | "none";
export type InvoiceStatus = "pending" | "paid" | "failed" | "cancelled";
export type RescheduleStatus = "pending" | "approved" | "rejected";
export type UserRole = "owner" | "teacher";
export type MessageTargetType = "all" | "class" | "individual";

export interface Studio {
  id: string;
  name: string;
  type: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  logo_url: string | null;
  payjp_secret_key: string | null;
  payjp_public_key: string | null;
  billing_day: number;
  created_at: string;
}

export interface StudioUser {
  id: string;
  studio_id: string;
  auth_id: string;
  name: string;
  email: string;
  role: UserRole;
  created_at: string;
}

export interface Student {
  id: string;
  studio_id: string;
  name: string;
  kana: string | null;
  birth_date: string | null;
  notes: string | null;
  status: StudentStatus;
  created_at: string;
  // joins
  guardians?: Guardian[];
  class_enrollments?: ClassEnrollment[];
}

export interface Guardian {
  id: string;
  student_id: string;
  auth_id: string | null;
  name: string;
  email: string;
  phone: string | null;
  relationship: string;
  payjp_customer_id: string | null;
  invite_token: string | null;
  invite_accepted_at: string | null;
  created_at: string;
}

export interface Class {
  id: string;
  studio_id: string;
  name: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  capacity: number;
  monthly_fee: number;
  color: string;
  created_at: string;
  // joins
  class_enrollments?: ClassEnrollment[];
}

export interface ClassEnrollment {
  id: string;
  class_id: string;
  student_id: string;
  enrolled_at: string;
  left_at: string | null;
  custom_fee: number | null;
  // joins
  class?: Class;
  student?: Student;
}

export interface Lesson {
  id: string;
  class_id: string;
  date: string;
  start_time: string;
  end_time: string;
  is_cancelled: boolean;
  cancel_reason: string | null;
  created_at: string;
  // joins
  class?: Class;
  attendance?: Attendance[];
}

export interface Attendance {
  id: string;
  lesson_id: string;
  student_id: string;
  status: AttendanceStatus;
  note: string | null;
  recorded_by: string | null;
  created_at: string;
  updated_at: string;
  // joins
  student?: Student;
  lesson?: Lesson;
}

export interface RescheduleRequest {
  id: string;
  attendance_id: string;
  student_id: string;
  guardian_id: string;
  target_lesson_id: string | null;
  status: RescheduleStatus;
  note: string | null;
  responded_at: string | null;
  created_at: string;
  // joins
  student?: Student;
  guardian?: Guardian;
}

export interface BillingPeriod {
  id: string;
  studio_id: string;
  year: number;
  month: number;
  locked_at: string | null;
  created_at: string;
}

export interface Invoice {
  id: string;
  billing_period_id: string | null;
  studio_id: string;
  student_id: string;
  guardian_id: string;
  amount: number;
  description: string;
  type: "monthly" | "extra";
  status: InvoiceStatus;
  payjp_charge_id: string | null;
  payjp_subscription_id: string | null;
  due_date: string | null;
  paid_at: string | null;
  failed_at: string | null;
  reminder_sent_at: string | null;
  created_at: string;
  // joins
  student?: Student;
  guardian?: Guardian;
}

export interface Message {
  id: string;
  studio_id: string;
  sender_id: string;
  title: string;
  body: string;
  target_type: MessageTargetType;
  target_id: string | null;
  created_at: string;
  // joins
  sender?: StudioUser;
  message_reads?: MessageRead[];
  read_count?: number;
  total_recipients?: number;
}

export interface MessageRead {
  message_id: string;
  guardian_id: string;
  read_at: string;
}

export interface MessageTemplate {
  id: string;
  studio_id: string;
  name: string;
  title: string;
  body: string;
  created_at: string;
}
