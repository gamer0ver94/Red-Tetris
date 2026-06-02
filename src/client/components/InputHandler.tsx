import { useEffect } from "react";
import { useDispatch } from "react-redux";

export function InputHandler() {
  const dispatch = useDispatch();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      console.log("Key pressed:", e.key);

      switch (e.key) {
        case "ArrowLeft":
          console.log("LEFT");
          break;

        case "ArrowRight":
          console.log("RIGHT");
          break;

        case "ArrowUp":
          console.log("UP");
          break;

        case "ArrowDown":
          console.log("DOWN");
          break;
        case "R":
          console.log("ROTATE");
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [dispatch]);

  return null;
}