CREATE TABLE assignments (
  id serial primary key,
  title varchar(128) not null,
  due timestamp with time zone,
  position int default 0,
  completed boolean default false,
  created timestamp with time zone not null default current_timestamp,
  updated timestamp with time zone not null default current_timestamp
);