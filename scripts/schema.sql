-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Tabla clientes autorizados
CREATE TABLE IF NOT EXISTS authorized_clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nif VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(255),
  authorization_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expiration_date TIMESTAMP,
  status VARCHAR(50) DEFAULT 'ACTIVE', -- ACTIVE, EXPIRED, CANCELLED
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabla CUPS asociados
CREATE TABLE IF NOT EXISTS client_supplies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES authorized_clients(id) ON DELETE CASCADE,
  cups VARCHAR(30) NOT NULL,
  address TEXT,
  postal_code VARCHAR(10),
  province VARCHAR(50),
  municipality VARCHAR(100),
  distributor_code VARCHAR(10),
  point_type INTEGER,
  valid_date_from DATE,
  valid_date_to DATE,
  last_sync TIMESTAMP,
  UNIQUE(client_id, cups)
);

-- 3. Tabla consumos (histórico)
CREATE TABLE IF NOT EXISTS consumption_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  supply_id UUID REFERENCES client_supplies(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  time TIME NOT NULL,
  consumption_kwh DECIMAL(10,3),
  obtain_method VARCHAR(20),
  surplus_energy_kwh DECIMAL(10,3),
  self_consumption_energy_kwh DECIMAL(10,3),
  generation_energy_kwh DECIMAL(10,3),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster queries on consumption data
CREATE INDEX IF NOT EXISTS idx_supply_date ON consumption_data (supply_id, date);

-- 4. Tabla análisis generados
CREATE TABLE IF NOT EXISTS consumption_analysis (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES authorized_clients(id) ON DELETE CASCADE,
  analysis_date DATE DEFAULT CURRENT_DATE,
  peak_hours JSONB, -- {hour: consumption}
  weekly_pattern JSONB,
  monthly_totals JSONB,
  recommendations JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
