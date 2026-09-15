import { useState } from "react";
import { Gamepad2 } from "lucide-react";
import { getGameArtwork } from "../data/gameArtwork";

export function GameArtwork({ name, className = "", priority = false }: {
  name: string;
  className?: string;
  priority?: boolean;
}) {
  const source = getGameArtwork(name);
  const [failedSource, setFailedSource] = useState<string>();

  return (
    <div className={`game-artwork ${className}`}>
      {source && source !== failedSource ? (
        <img
          src={source}
          alt=""
          width={460}
          height={215}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          onError={() => setFailedSource(source)}
        />
      ) : (
        <div className="game-artwork-fallback" aria-hidden="true">
          <Gamepad2 size={40} strokeWidth={1.5} />
        </div>
      )}
    </div>
  );
}
