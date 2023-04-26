import { LandmarkId } from "../types/landmark_id";
import { TileType } from "../types/tile_type";
import { ICountry } from "./country";

export interface ITile {
  pos: { x: number, y: number };
  owner: ICountry;

  type: TileType;
  landmark: LandmarkId;
}

export function createTile(pos: ITile["pos"], owner: ITile["owner"]): ITile {
  return {
    pos,
    owner,

    type: TileType.Nomad,
    landmark: LandmarkId.None,
  }
}