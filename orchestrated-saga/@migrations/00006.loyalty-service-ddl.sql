CREATE SCHEMA IF NOT EXISTS loyalty_service;

CREATE TABLE loyalty_service.loyalty_point (
  id SERIAL PRIMARY KEY,
  uuid UUID NOT NULL,
  order_uuid UUID NOT NULL,
  user_uuid UUID NOT NULL,
  points BIGINT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);