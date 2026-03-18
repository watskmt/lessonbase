-- ============================================================
-- Lessonbase Database Schema
-- dialect: PostgreSQL
-- language=PostgreSQL
-- ============================================================

-- Extensions
create extension if not exists "uuid-ossp";

-- ============================================================
-- STUDIOS (教室)
-- ============================================================
create table studios (
  id            uuid primary key default uuid_generate_v4(),
  name          text not null,
  type          text not null,            -- 'piano' | 'ballet' | 'english' | 'other'
  phone         text,
  email         text,
  address       text,
  logo_url      text,
  payjp_secret_key  text,                 -- PAY.JP シークレットキー (sk_live_... or sk_test_...)
  payjp_public_key  text,                 -- PAY.JP 公開キー (pk_live_... or pk_test_...)
  billing_day   int not null default 1,   -- 引き落とし日 (1-28)
  created_at    timestamptz default now()
);

-- ============================================================
-- USERS (オーナー・講師)
-- ============================================================
create table studio_users (
  id         uuid primary key default uuid_generate_v4(),
  studio_id  uuid not null references studios(id) on delete cascade,
  auth_id    uuid not null unique,        -- Supabase Auth user id
  name       text not null,
  email      text not null,
  role       text not null default 'teacher', -- 'owner' | 'teacher'
  created_at timestamptz default now()
);

create index on studio_users(studio_id);

-- ============================================================
-- STUDENTS (生徒)
-- ============================================================
create table students (
  id            uuid primary key default uuid_generate_v4(),
  studio_id     uuid not null references studios(id) on delete cascade,
  name          text not null,
  kana          text,
  birth_date    date,
  notes         text,
  status        text not null default 'active', -- 'active' | 'suspended' | 'withdrawn'
  created_at    timestamptz default now()
);

create index on students(studio_id);
create index on students(status);

-- ============================================================
-- GUARDIANS (保護者)
-- ============================================================
create table guardians (
  id              uuid primary key default uuid_generate_v4(),
  student_id      uuid not null references students(id) on delete cascade,
  auth_id         uuid unique,            -- Supabase Auth user id (nullable until accepted)
  name            text not null,
  email           text not null,
  phone           text,
  relationship    text not null default '保護者',
  payjp_customer_id text,               -- PAY.JP Customer ID
  invite_token    text unique,           -- 招待トークン
  invite_accepted_at timestamptz,
  created_at      timestamptz default now()
);

create index on guardians(student_id);
create index on guardians(email);

-- ============================================================
-- CLASSES (クラス)
-- ============================================================
create table classes (
  id          uuid primary key default uuid_generate_v4(),
  studio_id   uuid not null references studios(id) on delete cascade,
  name        text not null,
  day_of_week int not null,              -- 0=Sun, 1=Mon, ..., 6=Sat
  start_time  time not null,
  end_time    time not null,
  capacity    int not null default 10,
  monthly_fee int not null,              -- 月謝（円）
  color       text default 'indigo',
  created_at  timestamptz default now()
);

create index on classes(studio_id);

-- ============================================================
-- CLASS ENROLLMENTS (クラスへの生徒紐付け)
-- ============================================================
create table class_enrollments (
  id          uuid primary key default uuid_generate_v4(),
  class_id    uuid not null references classes(id) on delete cascade,
  student_id  uuid not null references students(id) on delete cascade,
  enrolled_at timestamptz default now(),
  left_at     timestamptz,
  custom_fee  int,                       -- 個別月謝上書き (nullならclass.monthly_fee)
  unique (class_id, student_id)
);

create index on class_enrollments(class_id);
create index on class_enrollments(student_id);

-- ============================================================
-- LESSONS (授業コマ - 実際に発生する日付)
-- ============================================================
create table lessons (
  id          uuid primary key default uuid_generate_v4(),
  class_id    uuid not null references classes(id) on delete cascade,
  date        date not null,
  start_time  time not null,
  end_time    time not null,
  is_cancelled boolean default false,
  cancel_reason text,
  created_at  timestamptz default now(),
  unique (class_id, date)
);

create index on lessons(class_id);
create index on lessons(date);

-- ============================================================
-- ATTENDANCE (出欠)
-- ============================================================
create table attendance (
  id          uuid primary key default uuid_generate_v4(),
  lesson_id   uuid not null references lessons(id) on delete cascade,
  student_id  uuid not null references students(id) on delete cascade,
  status      text not null default 'none', -- 'present' | 'absent' | 'reschedule' | 'none'
  note        text,
  recorded_by uuid references studio_users(id),
  created_at  timestamptz default now(),
  updated_at  timestamptz default now(),
  unique (lesson_id, student_id)
);

create index on attendance(lesson_id);
create index on attendance(student_id);

-- ============================================================
-- RESCHEDULE REQUESTS (振替申請)
-- ============================================================
create table reschedule_requests (
  id                uuid primary key default uuid_generate_v4(),
  attendance_id     uuid not null references attendance(id) on delete cascade,
  student_id        uuid not null references students(id) on delete cascade,
  guardian_id       uuid not null references guardians(id),
  target_lesson_id  uuid references lessons(id),  -- 振替先
  status            text not null default 'pending', -- 'pending' | 'approved' | 'rejected'
  note              text,
  responded_at      timestamptz,
  created_at        timestamptz default now()
);

create index on reschedule_requests(student_id);
create index on reschedule_requests(status);

-- ============================================================
-- BILLING PERIODS (月次請求期間)
-- ============================================================
create table billing_periods (
  id          uuid primary key default uuid_generate_v4(),
  studio_id   uuid not null references studios(id) on delete cascade,
  year        int not null,
  month       int not null,              -- 1-12
  locked_at   timestamptz,              -- 確定日時（以降は変更不可）
  created_at  timestamptz default now(),
  unique (studio_id, year, month)
);

-- ============================================================
-- INVOICES (請求)
-- ============================================================
create table invoices (
  id                  uuid primary key default uuid_generate_v4(),
  billing_period_id   uuid references billing_periods(id),
  studio_id           uuid not null references studios(id) on delete cascade,
  student_id          uuid not null references students(id),
  guardian_id         uuid not null references guardians(id),
  amount              int not null,      -- 請求金額（円）
  description         text not null,
  type                text not null default 'monthly', -- 'monthly' | 'extra'
  status              text not null default 'pending', -- 'pending' | 'paid' | 'failed' | 'cancelled'
  payjp_charge_id       text,
  payjp_subscription_id text,
  due_date            date,
  paid_at             timestamptz,
  failed_at           timestamptz,
  reminder_sent_at    timestamptz,
  created_at          timestamptz default now()
);

create index on invoices(studio_id);
create index on invoices(student_id);
create index on invoices(status);
create index on invoices(billing_period_id);

-- ============================================================
-- MESSAGES (連絡)
-- ============================================================
create table messages (
  id          uuid primary key default uuid_generate_v4(),
  studio_id   uuid not null references studios(id) on delete cascade,
  sender_id   uuid not null references studio_users(id),
  title       text not null,
  body        text not null,
  target_type text not null default 'all', -- 'all' | 'class' | 'individual'
  target_id   uuid,                       -- class_id or student_id
  created_at  timestamptz default now()
);

create index on messages(studio_id);
create index on messages(created_at desc);

create table message_reads (
  message_id  uuid not null references messages(id) on delete cascade,
  guardian_id uuid not null references guardians(id) on delete cascade,
  read_at     timestamptz default now(),
  primary key (message_id, guardian_id)
);

-- ============================================================
-- MESSAGE TEMPLATES (テンプレート)
-- ============================================================
create table message_templates (
  id          uuid primary key default uuid_generate_v4(),
  studio_id   uuid not null references studios(id) on delete cascade,
  name        text not null,
  title       text not null,
  body        text not null,
  created_at  timestamptz default now()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table studios enable row level security;
alter table studio_users enable row level security;
alter table students enable row level security;
alter table guardians enable row level security;
alter table classes enable row level security;
alter table class_enrollments enable row level security;
alter table lessons enable row level security;
alter table attendance enable row level security;
alter table reschedule_requests enable row level security;
alter table billing_periods enable row level security;
alter table invoices enable row level security;
alter table messages enable row level security;
alter table message_reads enable row level security;

-- Studio users can access their own studio's data
create policy "studio_users_own_studio" on studios
  for all using (
    id in (select studio_id from studio_users where auth_id = auth.uid())
  );

create policy "studio_users_own_records" on studio_users
  for all using (
    studio_id in (select studio_id from studio_users where auth_id = auth.uid())
  );

create policy "studio_users_students" on students
  for all using (
    studio_id in (select studio_id from studio_users where auth_id = auth.uid())
  );

create policy "studio_users_guardians" on guardians
  for all using (
    student_id in (
      select id from students where studio_id in (
        select studio_id from studio_users where auth_id = auth.uid()
      )
    )
  );

-- Guardians can access their own student's data
create policy "guardians_own_data" on guardians
  for select using (auth_id = auth.uid());

create policy "guardians_own_attendance" on attendance
  for select using (
    student_id in (
      select student_id from guardians where auth_id = auth.uid()
    )
  );

create policy "guardians_own_invoices" on invoices
  for select using (
    guardian_id in (select id from guardians where auth_id = auth.uid())
  );

create policy "guardians_own_messages" on messages
  for select using (
    studio_id in (
      select s.studio_id from students s
      join guardians g on g.student_id = s.id
      where g.auth_id = auth.uid()
    )
  );

create policy "guardians_message_reads" on message_reads
  for all using (
    guardian_id in (select id from guardians where auth_id = auth.uid())
  );

create policy "guardians_reschedule" on reschedule_requests
  for all using (
    guardian_id in (select id from guardians where auth_id = auth.uid())
  );

-- ============================================================
-- SEED DATA (開発用)
-- ============================================================

-- insert into studios (id, name, type, phone, email, billing_day) values
--   ('11111111-1111-1111-1111-111111111111', '山田ピアノ教室', 'piano', '03-1234-5678', 'yamada@example.com', 1);
