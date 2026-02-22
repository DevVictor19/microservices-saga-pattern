INSERT INTO orders_service."order" (uuid, user_uuid, status, total_price)
VALUES (
  '4143c3e8-d529-4809-8544-92f0949c5d16', 
  'cf9831a0-bc82-43ee-a5bd-1edcdab1d334', 
  'waiting_payment',
  350000 + (2 * 35000) + 60000 + 30000    
);


INSERT INTO orders_service.order_item (uuid, order_id, item_uuid, name, description, price, quantity)
VALUES
  ('249333f1-5b8e-4e44-b121-2e8f5c72a9cd', 1, '01094d51-0e14-46a9-a9a5-ff8710666ba6', 'Notebook', 'Notebook Dell Inspiron 15', 350000, 1),
  ('61e67642-a479-493a-964d-a6b5708ce117', 1, '6173694d-21b3-4018-b39d-e6a2e8bae02f', 'Mouse', 'Mouse Logitech MX Master 3', 35000, 2),
  ('08d722a8-adde-444b-be2d-12e1f7c3b049', 1, '631a0555-f3e2-4e85-a340-82a1173120f4', 'Headset', 'Headset HyperX Cloud II', 60000, 1),
  ('984c7c87-bfa0-45d1-a923-a0ef3a21b347', 1, '4919fa28-41f7-493f-90b1-070c4e57f49e', 'Webcam', 'Webcam Logitech C920', 30000, 1);

