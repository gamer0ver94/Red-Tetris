import { useEffect, useContext, useRef } from 'react';
import { socketContext } from '../../socket/socketContext';

type ActiveKeys = {
  left: boolean;
  right: boolean;
  down: boolean;
  rotateHeld: boolean;
};

export function InputHandler() {
  const socket = useContext(socketContext);
  const active = useRef<ActiveKeys>({ left: false, right: false, down: false, rotateHeld: false });

  useEffect(() => {
    if (!socket) return;

    const emitPressRelease = (eventBase: string, pressed: boolean) => {
      if (!socket) return;
      if (pressed) socket.emit(`${eventBase}:press`);
      else socket.emit(`${eventBase}:release`);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowLeft', 'ArrowRight', 'ArrowDown', ' '].includes(e.key)) e.preventDefault();

      switch (e.key) {
        case 'ArrowLeft':
          if (active.current.left) return;
          active.current.left = true;
          emitPressRelease('game:left', true);
          return;
        case 'ArrowRight':
          if (active.current.right) return;
          active.current.right = true;
          emitPressRelease('game:right', true);
          return;
        case 'ArrowDown':
          if (active.current.down) return;
          active.current.down = true;
          socket.emit('game:soft:press');
          return;
        case ' ':
          socket.emit('game:hard:press');
          return;
        case 'r':
        case 'R':
          socket.emit('game:rotate');
          return;
        case 'h':
        case'H':
          socket.emit('game:hold');
          return;
      }


    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (['ArrowLeft', 'ArrowRight', 'ArrowDown', ' '].includes(e.key)) e.preventDefault();

      switch (e.key) {
        case 'ArrowLeft':
          if (!active.current.left) return;
          active.current.left = false;
          emitPressRelease('game:left', false);
          return;
        case 'ArrowRight':
          if (!active.current.right) return;
          active.current.right = false;
          emitPressRelease('game:right', false);
          return;
        case 'ArrowDown':
          if (!active.current.down) return;
          active.current.down = false;
          //emitPressRelease('game:hard', false);
          socket.emit('game:soft:release');
          return;
        case ' ':
          socket.emit('game:hard:release');
          return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [socket]);

  return null;
}

