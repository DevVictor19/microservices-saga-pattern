CREATE SCHEMA IF NOT EXISTS stock_service;

CREATE TABLE stock_service.item (
  id SERIAL PRIMARY KEY,
  uuid UUID NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price BIGINT NOT NULL,
  quantity_in_stock INT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE stock_service.item_reservation (
  id SERIAL PRIMARY KEY,
  uuid UUID NOT NULL,
  item_id INT NOT NULL REFERENCES stock_service.item(id),
  user_uuid UUID NOT NULL,
  order_uuid UUID NOT NULL,
  quantity INT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE stock_service.item_delivery (
  id SERIAL PRIMARY KEY,
  uuid UUID NOT NULL,
  item_id INT NOT NULL REFERENCES stock_service.item(id),
  user_uuid UUID NOT NULL,
  order_uuid UUID NOT NULL,
  quantity INT NOT NULL,
  delivery_forecast TIMESTAMP NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);