alter table public.branches
  add column if not exists latitude double precision,
  add column if not exists longitude double precision,
  add column if not exists location_accuracy_meters double precision;

alter table public.branches
  add constraint branches_latitude_range_check
    check (latitude is null or latitude between -90 and 90),
  add constraint branches_longitude_range_check
    check (longitude is null or longitude between -180 and 180),
  add constraint branches_location_accuracy_check
    check (
      location_accuracy_meters is null
      or location_accuracy_meters >= 0
    );

comment on column public.branches.latitude is
  'Latitude captured from the browser geolocation API.';
comment on column public.branches.longitude is
  'Longitude captured from the browser geolocation API.';
comment on column public.branches.location_accuracy_meters is
  'Estimated geolocation accuracy radius in meters.';

notify pgrst, 'reload schema';
