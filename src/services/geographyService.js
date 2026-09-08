import { supabase } from "./primarySupabaseClient.js";

function throwIfError(response, actionMessage) {
  if (!response?.error) {
    return response?.data || [];
  }

  throw new Error(`${actionMessage}: ${response.error.message}`);
}

function sortByName(nameKey) {
  return (first, second) =>
    String(first?.[nameKey] || "").localeCompare(
      String(second?.[nameKey] || ""),
      "es-CR",
      { sensitivity: "base" },
    );
}

let geographyCatalogPromise = null;

export async function getCostaRicaGeographyCatalog() {
  if (!geographyCatalogPromise) {
    geographyCatalogPromise = (async () => {
      const [
        countriesResponse,
        provincesResponse,
        cantonsResponse,
        districtsResponse,
      ] = await Promise.all([
        supabase
          .from("countries")
          .select("country_id, country_code, country_name")
          .eq("is_active", true),
        supabase
          .from("provinces")
          .select("province_id, country_id, province_code, province_name")
          .eq("is_active", true),
        supabase
          .from("cantons")
          .select("canton_id, province_id, canton_code, canton_name")
          .eq("is_active", true),
        supabase
          .from("districts")
          .select("district_id, canton_id, district_code, district_name")
          .eq("is_active", true),
      ]);

      const countries = throwIfError(
        countriesResponse,
        "No fue posible cargar los países",
      );
      const provinces = throwIfError(
        provincesResponse,
        "No fue posible cargar las provincias",
      );
      const cantons = throwIfError(
        cantonsResponse,
        "No fue posible cargar los cantones",
      );
      const districts = throwIfError(
        districtsResponse,
        "No fue posible cargar los distritos",
      );

      const costaRica =
        countries.find(
          (country) =>
            String(country.country_code || "").trim().toUpperCase() === "CR" ||
            String(country.country_name || "").trim().toLowerCase() ===
              "costa rica",
        ) || countries[0];

      const costaRicaProvinces = provinces
        .filter((province) => province.country_id === costaRica?.country_id)
        .sort(sortByName("province_name"));

      return {
        country: costaRica || null,
        provinces: costaRicaProvinces,
        cantons: cantons.sort(sortByName("canton_name")),
        districts: districts.sort(sortByName("district_name")),
      };
    })();
  }

  return geographyCatalogPromise;
}
