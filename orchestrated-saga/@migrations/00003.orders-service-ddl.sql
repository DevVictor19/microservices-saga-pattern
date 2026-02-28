CREATE SCHEMA IF NOT EXISTS orders_service;

CREATE TYPE orders_service.order_status AS ENUM (
  'waiting_payment',
  'reserving_items',
  'unavailable_items',
  'payment_processing',
  'payment_failed',
  'payment_succeeded'
);

CREATE TABLE orders_service."order" (
  id SERIAL PRIMARY KEY,
  uuid UUID NOT NULL,
  user_uuid UUID NOT NULL,
  status orders_service.order_status NOT NULL,
  total_price BIGINT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE orders_service.order_item (
  id SERIAL PRIMARY KEY,
  uuid UUID NOT NULL,
  order_id INT NOT NULL REFERENCES orders_service."order"(id),
  item_uuid UUID NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price BIGINT NOT NULL,
  quantity INT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);