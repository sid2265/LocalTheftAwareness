-- Table: theft_reports
create table if not exists theft_reports (
  id uuid primary key default uuid_generate_v4(),
  station text not null,
  datetime timestamptz not null,
  description text,
  lat double precision,
  lng double precision,
  created_at timestamptz default now()
);

-- Table: stations
create table if not exists stations (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  lat double precision not null,
  lng double precision not null
);
