import Header from "@/components/_game/Header";
import Footer from "@/components/_game/Footer";
import Map from "@/components/_game/Map";
import { useEffect } from "react";
import { useGameStore } from "@/stores/gameStore";
import { game } from "@core/game";

export default function Game() {
  useEffect(() => {
    useGameStore.setState(s => {
      if (s.data.running) return;

      game.play.generate(s.data, { w: s.data.width, h: s.data.height, seed: s.data.seed });
      game.play.start(s.data, {});
      s.country = game.util.turnTypeToCountry(s.data, s.data.turn.type);
    });
  }, []);

  return (
    <>
      <Header />
      <Footer />

      <Map />
    </>
  )
}
