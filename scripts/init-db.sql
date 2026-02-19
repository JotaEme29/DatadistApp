-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Generic updated_at trigger
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Table: authorized_clients
create table if not exists authorized_clients (
  id uuid default uuid_generate_v4() primary key,
  nif varchar(20) unique not null,
  name varchar(255),
  status varchar(50) default 'ACTIVE', -- ACTIVE, REVOKED
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Table: client_supplies
create table if not exists client_supplies (
  id uuid default uuid_generate_v4() primary key,
  client_nif varchar(20) references authorized_clients(nif) on delete cascade,
  cups varchar(30) unique not null,
  address text,
  postal_code varchar(10),
  province varchar(100),
  municipality varchar(100),
  distributor_code varchar(10),
  point_type integer,
  valid_date_from varchar(20),
  valid_date_to varchar(20),
  last_sync timestamp with time zone,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Table: consumption_data
create table if not exists consumption_data (
  id uuid default uuid_generate_v4() primary key,
  cups varchar(30) references client_supplies(cups) on delete cascade,
  date date not null,
  time varchar(10) not null,
  consumption_kwh decimal(10,3),
  obtain_method varchar(20),
  created_at timestamp with time zone default now(),
  unique(cups, date, time) -- Ensure no duplicates for same timestamp
);

-- Indexes for performance
create index if not exists idx_client_supplies_nif on client_supplies(client_nif);
create index if not exists idx_consumption_cups_date on consumption_data(cups, date);
create index if not exists idx_client_supplies_last_sync on client_supplies(last_sync);

drop trigger if exists trg_authorized_clients_updated_at on authorized_clients;
create trigger trg_authorized_clients_updated_at
before update on authorized_clients
for each row execute function set_updated_at();

drop trigger if exists trg_client_supplies_updated_at on client_supplies;
create trigger trg_client_supplies_updated_at
before update on client_supplies
for each row execute function set_updated_at();
