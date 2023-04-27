import { IGameData } from "../gamedata";
import { createCountry } from "../lib/country";
import { CountryId } from "../types/country_id";

type Info = { country: CountryId };

export function addCountryActable(data: IGameData, info: Info): boolean {
  // If country already exist
  const existing = data.countries.filter(c => c.id === info.country).length > 0;
  if (existing) return false;

  return true;
}

export function addCountry(data: IGameData, info: Info) {
  if (!addCountryActable(data, info)) return;

  data.countries.push(createCountry(info.country));
}