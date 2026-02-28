CREATE SCHEMA IF NOT EXISTS payments_service;

CREATE TYPE payments_service.payment_status AS ENUM (
  'pending',
  'completed',
  'failed'
);

CREATE TABLE payments_service.payment (
  id SERIAL PRIMARY KEY,
  uuid UUID NOT NULL,
  payment_method_uuid UUID NOT NULL,
  order_uuid UUID NOT NULL,
  user_uuid UUID NOT NULL,
  status payments_service.payment_status NOT NULL,
  total_price BIGINT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);