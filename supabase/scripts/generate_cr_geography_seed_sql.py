from __future__ import annotations

import argparse
import re
from pathlib import Path

import pdfplumber


ROW_PATTERN = re.compile(
    r"^(\d+)\s+(.+?)\s+(\d+)\s+(.+?)\s+(\d+)\s+(.+?)\s+\d+(?:\s+.*)?$"
)


def sql_literal(value: str) -> str:
    return "'" + value.replace("'", "''") + "'"


def extract_rows(pdf_path: Path) -> list[tuple[int, str, int, str, int, str]]:
    rows: list[tuple[int, str, int, str, int, str]] = []
    bad_rows: list[tuple[int, str]] = []

    with pdfplumber.open(pdf_path) as pdf:
        for page_number, page in enumerate(pdf.pages, 1):
            text = page.extract_text() or ""
            for raw_line in text.splitlines():
                line = raw_line.strip()
                if not line or line.startswith("Provincia "):
                    continue

                match = ROW_PATTERN.match(line)
                if not match:
                    bad_rows.append((page_number, line))
                    continue

                province_code, province_name, canton_code, canton_name, district_code, district_name = match.groups()
                rows.append(
                    (
                        int(province_code),
                        province_name.strip(),
                        int(canton_code),
                        canton_name.strip(),
                        int(district_code),
                        district_name.strip(),
                    )
                )

    if bad_rows:
        sample = "\n".join(f"page {page}: {line}" for page, line in bad_rows[:20])
        raise RuntimeError(f"Could not parse {len(bad_rows)} rows:\n{sample}")

    return rows


def write_country_script(output_dir: Path) -> None:
    sql = """begin;

insert into public.countries (country_code, country_name, is_active)
values ('CR', 'Costa Rica', true)
on conflict (country_code) do update
set country_name = excluded.country_name,
    is_active = excluded.is_active,
    updated_at = now();

commit;
"""
    (output_dir / "001_seed_country_costa_rica.sql").write_text(sql, encoding="utf-8")


def write_provinces_script(
    output_dir: Path, provinces: list[tuple[int, str]]
) -> None:
    values = ",\n".join(
        f"  ({sql_literal(str(code).zfill(2))}, {sql_literal(name)})"
        for code, name in provinces
    )
    sql = f"""begin;

with country as (
  select country_id
  from public.countries
  where country_code = 'CR'
),
source_data (province_code, province_name) as (
  values
{values}
)
insert into public.provinces (country_id, province_code, province_name, is_active)
select country.country_id, source_data.province_code, source_data.province_name, true
from source_data
cross join country
on conflict (country_id, province_name) do update
set province_code = excluded.province_code,
    is_active = excluded.is_active,
    updated_at = now();

commit;
"""
    (output_dir / "002_seed_provinces_costa_rica.sql").write_text(sql, encoding="utf-8")


def write_cantons_script(
    output_dir: Path, cantons: list[tuple[int, str, int, str]]
) -> None:
    values = ",\n".join(
        "  "
        + ", ".join(
            [
                sql_literal(str(province_code).zfill(2)),
                sql_literal(province_name),
                sql_literal(str(canton_code).zfill(2)),
                sql_literal(canton_name),
            ]
        ).join(("(", ")"))
        for province_code, province_name, canton_code, canton_name in cantons
    )
    sql = f"""begin;

with country as (
  select country_id
  from public.countries
  where country_code = 'CR'
),
source_data (province_code, province_name, canton_code, canton_name) as (
  values
{values}
)
insert into public.cantons (province_id, canton_code, canton_name, is_active)
select province.province_id, source_data.canton_code, source_data.canton_name, true
from source_data
cross join country
join public.provinces as province
  on province.country_id = country.country_id
 and province.province_name = source_data.province_name
on conflict (province_id, canton_name) do update
set canton_code = excluded.canton_code,
    is_active = excluded.is_active,
    updated_at = now();

commit;
"""
    (output_dir / "003_seed_cantons_costa_rica.sql").write_text(sql, encoding="utf-8")


def write_districts_script(
    output_dir: Path, districts: list[tuple[int, str, int, str, int, str]]
) -> None:
    values = ",\n".join(
        "  "
        + ", ".join(
            [
                sql_literal(str(province_code).zfill(2)),
                sql_literal(province_name),
                sql_literal(str(canton_code).zfill(2)),
                sql_literal(canton_name),
                sql_literal(str(district_code).zfill(2)),
                sql_literal(district_name),
            ]
        ).join(("(", ")"))
        for province_code, province_name, canton_code, canton_name, district_code, district_name in districts
    )
    sql = f"""begin;

with country as (
  select country_id
  from public.countries
  where country_code = 'CR'
),
source_data (
  province_code,
  province_name,
  canton_code,
  canton_name,
  district_code,
  district_name
) as (
  values
{values}
)
insert into public.districts (canton_id, district_code, district_name, is_active)
select canton.canton_id, source_data.district_code, source_data.district_name, true
from source_data
cross join country
join public.provinces as province
  on province.country_id = country.country_id
 and province.province_name = source_data.province_name
join public.cantons as canton
  on canton.province_id = province.province_id
 and canton.canton_name = source_data.canton_name
on conflict (canton_id, district_name) do update
set district_code = excluded.district_code,
    is_active = excluded.is_active,
    updated_at = now();

commit;
"""
    (output_dir / "004_seed_districts_costa_rica.sql").write_text(sql, encoding="utf-8")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--pdf", required=True, type=Path)
    parser.add_argument("--output-dir", required=True, type=Path)
    args = parser.parse_args()

    rows = extract_rows(args.pdf)
    args.output_dir.mkdir(parents=True, exist_ok=True)

    provinces = sorted({(pc, pn) for pc, pn, _, _, _, _ in rows})
    cantons = sorted({(pc, pn, cc, cn) for pc, pn, cc, cn, _, _ in rows})
    districts = sorted({(pc, pn, cc, cn, dc, dn) for pc, pn, cc, cn, dc, dn in rows})

    write_country_script(args.output_dir)
    write_provinces_script(args.output_dir, provinces)
    write_cantons_script(args.output_dir, cantons)
    write_districts_script(args.output_dir, districts)

    print(f"Extracted {len(rows)} barrio rows from {args.pdf}")
    print(f"Generated {len(provinces)} provinces")
    print(f"Generated {len(cantons)} cantons")
    print(f"Generated {len(districts)} districts")


if __name__ == "__main__":
    main()
